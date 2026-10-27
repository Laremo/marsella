package com.marsella.exam.repository;

import com.marsella.exam.model.SchoolGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SchoolGroupRepository extends JpaRepository<SchoolGroup, Long> {

    List<SchoolGroup> findByTeacherIdOrderByGradeAscNameAsc(Long teacherId);

    Optional<SchoolGroup> findByIdAndTeacherId(Long id, Long teacherId);

    @Query("SELECT g FROM SchoolGroup g LEFT JOIN FETCH g.periods WHERE g.id = :id AND g.teacher.id = :teacherId")
    Optional<SchoolGroup> findByIdAndTeacherIdWithPeriods(@Param("id") Long id, @Param("teacherId") Long teacherId);
}
