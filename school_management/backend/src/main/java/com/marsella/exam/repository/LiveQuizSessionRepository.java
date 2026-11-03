package com.marsella.exam.repository;

import com.marsella.exam.model.LiveQuizSession;
import com.marsella.exam.model.QuizSessionStatus;
import com.marsella.exam.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LiveQuizSessionRepository extends JpaRepository<LiveQuizSession, Long> {
    Optional<LiveQuizSession> findByPin(String pin);
    List<LiveQuizSession> findByTeacherOrderByCreatedAtDesc(User teacher);
    List<LiveQuizSession> findByTeacherAndStatusNot(User teacher, QuizSessionStatus status);
}
