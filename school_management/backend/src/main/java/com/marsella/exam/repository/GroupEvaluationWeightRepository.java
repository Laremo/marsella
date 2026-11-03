package com.marsella.exam.repository;

import com.marsella.exam.model.GroupEvaluationWeight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupEvaluationWeightRepository extends JpaRepository<GroupEvaluationWeight, Long> {
    List<GroupEvaluationWeight> findBySchoolGroupIdOrderByIdAsc(Long schoolGroupId);
    void deleteBySchoolGroupId(Long schoolGroupId);
}
