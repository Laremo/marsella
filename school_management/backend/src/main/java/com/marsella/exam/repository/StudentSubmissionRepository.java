package com.marsella.exam.repository;

import com.marsella.exam.model.StudentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentSubmissionRepository extends JpaRepository<StudentSubmission, Long> {
    Optional<StudentSubmission> findByExamIdAndStudentNameIgnoreCase(Long examId, String studentName);
    List<StudentSubmission> findByExamIdOrderByStartedAtDesc(Long examId);
    List<StudentSubmission> findByExamIdOrderByStudentNameAsc(Long examId);
    long countByExamId(Long examId);
    long countByExamIdAndIsCompletedTrue(Long examId);

    @Modifying
    @Query("DELETE FROM StudentSubmission s WHERE s.exam.id = :examId")
    void deleteByExamId(@Param("examId") Long examId);
}
