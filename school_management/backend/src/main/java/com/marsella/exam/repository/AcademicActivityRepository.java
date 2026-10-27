package com.marsella.exam.repository;

import com.marsella.exam.model.AcademicActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AcademicActivityRepository extends JpaRepository<AcademicActivity, Long> {

    List<AcademicActivity> findBySchoolGroupIdOrderByDueDateDescCreatedAtDesc(Long schoolGroupId);

    List<AcademicActivity> findBySchoolGroupIdAndAcademicPeriodIdOrderByDueDateAscCreatedAtAsc(Long schoolGroupId, Long academicPeriodId);
}
