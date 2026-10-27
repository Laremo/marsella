package com.marsella.exam.service;

import com.marsella.exam.dto.BulkImportStudentsRequest;
import com.marsella.exam.dto.StudentDto;
import com.marsella.exam.model.Exam;
import com.marsella.exam.model.SchoolGroup;
import com.marsella.exam.model.Student;
import com.marsella.exam.model.StudentSubmission;
import com.marsella.exam.repository.ExamRepository;
import com.marsella.exam.repository.SchoolGroupRepository;
import com.marsella.exam.repository.StudentRepository;
import com.marsella.exam.repository.StudentSubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentManagementService {

    private final StudentRepository studentRepository;
    private final SchoolGroupRepository groupRepository;
    private final ExamRepository examRepository;
    private final StudentSubmissionRepository submissionRepository;

    @Transactional(readOnly = true)
    public List<StudentDto> getGroupStudents(Long teacherId, Long groupId) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        List<Student> students = studentRepository.findBySchoolGroupIdOrderByFullNameAsc(group.getId());
        return students.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public StudentDto addStudent(Long teacherId, Long groupId, StudentDto dto) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        String cleanName = dto.getFullName().trim();
        if (studentRepository.existsBySchoolGroupIdAndFullNameIgnoreCase(group.getId(), cleanName)) {
            throw new IllegalArgumentException("Ya existe un alumno con el nombre '" + cleanName + "' en este grupo");
        }

        int nextListNumber = dto.getListNumber() != null
                ? dto.getListNumber()
                : (int) studentRepository.countBySchoolGroupId(group.getId()) + 1;

        Student student = Student.builder()
                .schoolGroup(group)
                .fullName(cleanName)
                .studentIdentifier(dto.getStudentIdentifier() != null ? dto.getStudentIdentifier().trim() : null)
                .listNumber(nextListNumber)
                .notes(dto.getNotes())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .build();

        Student saved = studentRepository.save(student);
        return mapToDto(saved);
    }

    @Transactional
    public StudentDto updateStudent(Long teacherId, Long groupId, Long studentId, StudentDto dto) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        Student student = studentRepository.findByIdAndSchoolGroupId(studentId, group.getId())
                .orElseThrow(() -> new NoSuchElementException("Alumno no encontrado"));

        student.setFullName(dto.getFullName().trim());
        if (dto.getStudentIdentifier() != null) student.setStudentIdentifier(dto.getStudentIdentifier().trim());
        if (dto.getListNumber() != null) student.setListNumber(dto.getListNumber());
        if (dto.getNotes() != null) student.setNotes(dto.getNotes());
        if (dto.getActive() != null) student.setActive(dto.getActive());

        Student saved = studentRepository.save(student);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteStudent(Long teacherId, Long groupId, Long studentId) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        Student student = studentRepository.findByIdAndSchoolGroupId(studentId, group.getId())
                .orElseThrow(() -> new NoSuchElementException("Alumno no encontrado"));

        studentRepository.delete(student);
    }

    /**
     * Import students in bulk into a group from an existing exam or raw text list.
     */
    @Transactional
    public Map<String, Object> bulkImportStudents(Long teacherId, Long groupId, BulkImportStudentsRequest request) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        Set<String> candidateNames = new LinkedHashSet<>();

        // 1. If sourceExamId is provided, extract names from submissions
        if (request.getSourceExamId() != null) {
            Exam exam = examRepository.findByIdAndTeacherId(request.getSourceExamId(), teacherId)
                    .orElseThrow(() -> new NoSuchElementException("Examen no encontrado"));

            List<StudentSubmission> subs = submissionRepository.findByExamIdOrderByStudentNameAsc(exam.getId());
            for (StudentSubmission s : subs) {
                if (s.getStudentName() != null && !s.getStudentName().trim().isBlank()) {
                    candidateNames.add(s.getStudentName().trim());
                }
            }
        }

        // 2. If raw text provided (e.g. pasted list from Excel/Word)
        if (request.getRawNamesText() != null && !request.getRawNamesText().isBlank()) {
            String[] lines = request.getRawNamesText().split("\\r?\\n");
            for (String line : lines) {
                String trimmed = line.trim();
                // strip leading numbering like "1. ", "1 - ", etc.
                trimmed = trimmed.replaceFirst("^\\d+[.\\s-]+", "").trim();
                if (!trimmed.isBlank()) {
                    candidateNames.add(trimmed);
                }
            }
        }

        // 3. If explicit list provided
        if (request.getStudentNames() != null) {
            for (String n : request.getStudentNames()) {
                if (n != null && !n.trim().isBlank()) {
                    candidateNames.add(n.trim());
                }
            }
        }

        // Sort candidate names alphabetically
        List<String> sortedNames = new ArrayList<>(candidateNames);
        Collections.sort(sortedNames, String.CASE_INSENSITIVE_ORDER);

        List<Student> existingStudents = studentRepository.findBySchoolGroupIdOrderByFullNameAsc(group.getId());
        Set<String> existingNamesLower = existingStudents.stream()
                .map(s -> s.getFullName().trim().toLowerCase())
                .collect(Collectors.toSet());

        List<Student> toCreate = new ArrayList<>();
        int currentCount = existingStudents.size();
        int skippedCount = 0;

        for (String name : sortedNames) {
            if (existingNamesLower.contains(name.toLowerCase())) {
                skippedCount++;
                continue;
            }
            currentCount++;
            Student student = Student.builder()
                    .schoolGroup(group)
                    .fullName(name)
                    .listNumber(currentCount)
                    .active(true)
                    .build();
            toCreate.add(student);
            existingNamesLower.add(name.toLowerCase());
        }

        List<Student> saved = studentRepository.saveAll(toCreate);
        log.info("Bulk imported {} students into group {} (Skipped {} duplicates)",
                saved.size(), group.getName(), skippedCount);

        Map<String, Object> result = new HashMap<>();
        result.put("importedCount", saved.size());
        result.put("skippedDuplicates", skippedCount);
        result.put("totalStudentsInGroup", studentRepository.countBySchoolGroupId(group.getId()));
        return result;
    }

    public StudentDto mapToDto(Student s) {
        return StudentDto.builder()
                .id(s.getId())
                .fullName(s.getFullName())
                .studentIdentifier(s.getStudentIdentifier())
                .listNumber(s.getListNumber())
                .notes(s.getNotes())
                .active(s.getActive())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
