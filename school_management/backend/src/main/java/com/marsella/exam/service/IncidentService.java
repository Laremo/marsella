package com.marsella.exam.service;

import com.marsella.exam.dto.IncidentDto;
import com.marsella.exam.model.AcademicPeriod;
import com.marsella.exam.model.SchoolGroup;
import com.marsella.exam.model.Student;
import com.marsella.exam.model.StudentIncident;
import com.marsella.exam.repository.AcademicPeriodRepository;
import com.marsella.exam.repository.SchoolGroupRepository;
import com.marsella.exam.repository.StudentIncidentRepository;
import com.marsella.exam.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentService {

    private final StudentIncidentRepository incidentRepository;
    private final SchoolGroupRepository groupRepository;
    private final AcademicPeriodRepository periodRepository;
    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public List<IncidentDto> getGroupIncidents(Long teacherId, Long groupId, Long periodId) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        List<StudentIncident> incidents;
        if (periodId != null) {
            incidents = incidentRepository.findBySchoolGroupIdAndAcademicPeriodIdOrderByDateDescCreatedAtDesc(group.getId(), periodId);
        } else {
            incidents = incidentRepository.findBySchoolGroupIdOrderByDateDescCreatedAtDesc(group.getId());
        }

        return incidents.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public IncidentDto createIncident(Long teacherId, Long groupId, IncidentDto dto) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        Student student = studentRepository.findByIdAndSchoolGroupId(dto.getStudentId(), group.getId())
                .orElseThrow(() -> new NoSuchElementException("Alumno no encontrado"));

        AcademicPeriod period = null;
        if (dto.getAcademicPeriodId() != null) {
            period = periodRepository.findByIdAndSchoolGroupId(dto.getAcademicPeriodId(), group.getId()).orElse(null);
        }

        StudentIncident incident = StudentIncident.builder()
                .student(student)
                .schoolGroup(group)
                .academicPeriod(period)
                .date(dto.getDate())
                .type(dto.getType())
                .severity(dto.getSeverity())
                .title(dto.getTitle().trim())
                .description(dto.getDescription())
                .pointDeduction(dto.getPointDeduction() != null ? dto.getPointDeduction() : 0.0)
                .build();

        StudentIncident saved = incidentRepository.save(incident);
        log.info("Registered incident '{}' ({}) for student {}", saved.getTitle(), saved.getType(), student.getFullName());
        return mapToDto(saved);
    }

    @Transactional
    public void deleteIncident(Long teacherId, Long groupId, Long incidentId) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        StudentIncident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new NoSuchElementException("Incidencia no encontrada"));

        if (!incident.getSchoolGroup().getId().equals(group.getId())) {
            throw new IllegalArgumentException("La incidencia no pertenece a este grupo");
        }

        incidentRepository.delete(incident);
    }

    public IncidentDto mapToDto(StudentIncident inc) {
        return IncidentDto.builder()
                .id(inc.getId())
                .studentId(inc.getStudent().getId())
                .studentName(inc.getStudent().getFullName())
                .academicPeriodId(inc.getAcademicPeriod() != null ? inc.getAcademicPeriod().getId() : null)
                .periodName(inc.getAcademicPeriod() != null ? inc.getAcademicPeriod().getName() : "")
                .date(inc.getDate())
                .type(inc.getType())
                .typeLabel(inc.getType() != null ? inc.getType().getLabel() : "")
                .severity(inc.getSeverity())
                .severityLabel(inc.getSeverity() != null ? inc.getSeverity().getLabel() : "")
                .title(inc.getTitle())
                .description(inc.getDescription())
                .pointDeduction(inc.getPointDeduction())
                .createdAt(inc.getCreatedAt())
                .build();
    }
}
