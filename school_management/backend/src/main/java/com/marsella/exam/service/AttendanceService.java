package com.marsella.exam.service;

import com.marsella.exam.dto.AttendanceDto.*;
import com.marsella.exam.model.*;
import com.marsella.exam.repository.AcademicPeriodRepository;
import com.marsella.exam.repository.AttendanceRecordRepository;
import com.marsella.exam.repository.SchoolGroupRepository;
import com.marsella.exam.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

    private final AttendanceRecordRepository attendanceRepository;
    private final SchoolGroupRepository groupRepository;
    private final AcademicPeriodRepository periodRepository;
    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public GroupAttendanceOverview getDailyAttendance(Long teacherId, Long groupId, LocalDate date) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        List<Student> students = studentRepository.findBySchoolGroupIdOrderByFullNameAsc(group.getId());
        List<AttendanceRecord> records = attendanceRepository.findBySchoolGroupIdAndDateOrderByStudentFullNameAsc(group.getId(), date);

        Map<Long, AttendanceRecord> recordMap = records.stream()
                .collect(Collectors.toMap(r -> r.getStudent().getId(), r -> r, (a, b) -> a));

        List<StudentAttendanceItem> items = new ArrayList<>();
        int present = 0, absent = 0, late = 0, justified = 0;

        for (Student s : students) {
            AttendanceRecord r = recordMap.get(s.getId());
            AttendanceStatus status = r != null ? r.getStatus() : AttendanceStatus.PRESENT;
            String remarks = r != null ? r.getRemarks() : "";

            if (status == AttendanceStatus.PRESENT) present++;
            else if (status == AttendanceStatus.ABSENT) absent++;
            else if (status == AttendanceStatus.LATE) late++;
            else if (status == AttendanceStatus.JUSTIFIED) justified++;

            items.add(StudentAttendanceItem.builder()
                    .studentId(s.getId())
                    .studentName(s.getFullName())
                    .listNumber(s.getListNumber())
                    .status(status)
                    .remarks(remarks)
                    .build());
        }

        return GroupAttendanceOverview.builder()
                .date(date)
                .totalEnrolled(students.size())
                .present(present)
                .absent(absent)
                .late(late)
                .justified(justified)
                .records(items)
                .build();
    }

    @Transactional
    public GroupAttendanceOverview saveDailyAttendance(Long teacherId, Long groupId, DailyAttendanceRequest request) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        AcademicPeriod period = null;
        if (request.getAcademicPeriodId() != null) {
            period = periodRepository.findByIdAndSchoolGroupId(request.getAcademicPeriodId(), group.getId()).orElse(null);
        }
        if (period == null) {
            // Find current active period or first period
            List<AcademicPeriod> periods = periodRepository.findBySchoolGroupIdOrderByPeriodNumberAsc(group.getId());
            period = periods.stream().filter(p -> Boolean.TRUE.equals(p.getIsCurrent())).findFirst()
                    .orElse(periods.isEmpty() ? null : periods.get(0));
        }

        List<Student> students = studentRepository.findBySchoolGroupIdOrderByFullNameAsc(group.getId());
        Map<Long, Student> studentMap = students.stream().collect(Collectors.toMap(Student::getId, s -> s));

        List<AttendanceRecord> toSave = new ArrayList<>();
        for (StudentAttendanceItem item : request.getItems()) {
            Student student = studentMap.get(item.getStudentId());
            if (student == null) continue;

            Optional<AttendanceRecord> existingOpt = attendanceRepository.findByStudentIdAndDate(student.getId(), request.getDate());
            AttendanceRecord record;
            if (existingOpt.isPresent()) {
                record = existingOpt.get();
                record.setStatus(item.getStatus() != null ? item.getStatus() : AttendanceStatus.PRESENT);
                record.setRemarks(item.getRemarks());
                if (period != null) record.setAcademicPeriod(period);
            } else {
                record = AttendanceRecord.builder()
                        .student(student)
                        .schoolGroup(group)
                        .academicPeriod(period)
                        .date(request.getDate())
                        .status(item.getStatus() != null ? item.getStatus() : AttendanceStatus.PRESENT)
                        .remarks(item.getRemarks())
                        .build();
            }
            toSave.add(record);
        }

        attendanceRepository.saveAll(toSave);
        log.info("Saved {} attendance records for group {} on date {}", toSave.size(), group.getName(), request.getDate());

        return getDailyAttendance(teacherId, groupId, request.getDate());
    }

    @Transactional(readOnly = true)
    public List<StudentAttendanceSummary> getPeriodAttendanceSummary(Long teacherId, Long groupId, Long periodId) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        AcademicPeriod period = periodRepository.findByIdAndSchoolGroupId(periodId, group.getId())
                .orElseThrow(() -> new NoSuchElementException("Período no encontrado"));

        List<Student> students = studentRepository.findBySchoolGroupIdOrderByFullNameAsc(group.getId());
        List<AttendanceRecord> records = attendanceRepository.findBySchoolGroupIdAndAcademicPeriodIdOrderByDateAsc(group.getId(), period.getId());

        // Group records by student ID
        Map<Long, List<AttendanceRecord>> studentRecords = records.stream()
                .collect(Collectors.groupingBy(r -> r.getStudent().getId()));

        List<StudentAttendanceSummary> summaries = new ArrayList<>();
        double weight = period.getAttendanceWeight() != null ? period.getAttendanceWeight() : 20.0;

        for (Student s : students) {
            List<AttendanceRecord> list = studentRecords.getOrDefault(s.getId(), Collections.emptyList());
            int total = list.size();
            int present = 0, absent = 0, late = 0, justified = 0;

            for (AttendanceRecord r : list) {
                if (r.getStatus() == AttendanceStatus.PRESENT) present++;
                else if (r.getStatus() == AttendanceStatus.ABSENT) absent++;
                else if (r.getStatus() == AttendanceStatus.LATE) late++;
                else if (r.getStatus() == AttendanceStatus.JUSTIFIED) justified++;
            }

            // Calculation: Present = 1.0, Late = 0.5, Justified = 1.0, Absent = 0
            double effectiveAttendance = present + justified + (late * 0.5);
            double pct = total > 0 ? Math.round((effectiveAttendance / total) * 100.0 * 10.0) / 10.0 : 100.0;
            double pointsAwarded = Math.round((pct / 100.0) * weight * 10.0) / 10.0;

            summaries.add(StudentAttendanceSummary.builder()
                    .studentId(s.getId())
                    .studentName(s.getFullName())
                    .listNumber(s.getListNumber())
                    .totalDays(total)
                    .presentCount(present)
                    .absentCount(absent)
                    .lateCount(late)
                    .justifiedCount(justified)
                    .attendancePercentage(pct)
                    .pointsAwarded(pointsAwarded)
                    .build());
        }

        return summaries;
    }
}
