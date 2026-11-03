package com.marsella.exam.repository;

import com.marsella.exam.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    Optional<Exam> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
    List<Exam> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);
    Optional<Exam> findByIdAndTeacherId(Long id, Long teacherId);
}
