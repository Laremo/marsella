package com.marsella.exam.repository;

import com.marsella.exam.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findBySchoolGroupIdAndDateOrderByStudentFullNameAsc(Long schoolGroupId, LocalDate date);

    List<AttendanceRecord> findBySchoolGroupIdAndAcademicPeriodIdOrderByDateAsc(Long schoolGroupId, Long academicPeriodId);

    Optional<AttendanceRecord> findByStudentIdAndDate(Long studentId, LocalDate date);

    @Query("SELECT r FROM AttendanceRecord r WHERE r.student.id = :studentId AND r.academicPeriod.id = :periodId")
    List<AttendanceRecord> findByStudentIdAndPeriodId(@Param("studentId") Long studentId, @Param("periodId") Long periodId);
}
