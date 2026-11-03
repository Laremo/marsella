package com.marsella.exam.repository;

import com.marsella.exam.model.StudentActivityScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentActivityScoreRepository extends JpaRepository<StudentActivityScore, Long> {

    List<StudentActivityScore> findByActivityId(Long activityId);

    Optional<StudentActivityScore> findByActivityIdAndStudentId(Long activityId, Long studentId);

    @Query("SELECT s FROM StudentActivityScore s WHERE s.activity.academicPeriod.id = :periodId")
    List<StudentActivityScore> findByPeriodId(@Param("periodId") Long periodId);
}
