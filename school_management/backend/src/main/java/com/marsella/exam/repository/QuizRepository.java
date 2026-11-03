package com.marsella.exam.repository;

import com.marsella.exam.model.Quiz;
import com.marsella.exam.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByTeacherOrderByCreatedAtDesc(User teacher);
    List<Quiz> findBySchoolGroupIdOrderByCreatedAtDesc(Long schoolGroupId);
}

