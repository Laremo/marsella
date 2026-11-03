package com.marsella.exam.repository;

import com.marsella.exam.model.AcademicPeriod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicPeriodRepository extends JpaRepository<AcademicPeriod, Long> {

    List<AcademicPeriod> findBySchoolGroupIdOrderByPeriodNumberAsc(Long schoolGroupId);

    Optional<AcademicPeriod> findByIdAndSchoolGroupId(Long id, Long schoolGroupId);
}
