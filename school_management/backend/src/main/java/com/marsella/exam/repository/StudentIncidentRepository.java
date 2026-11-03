package com.marsella.exam.repository;

import com.marsella.exam.model.StudentIncident;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentIncidentRepository extends JpaRepository<StudentIncident, Long> {

    List<StudentIncident> findBySchoolGroupIdOrderByDateDescCreatedAtDesc(Long schoolGroupId);

    List<StudentIncident> findBySchoolGroupIdAndAcademicPeriodIdOrderByDateDescCreatedAtDesc(Long schoolGroupId, Long academicPeriodId);

    List<StudentIncident> findByStudentIdOrderByDateDesc(Long studentId);
}
