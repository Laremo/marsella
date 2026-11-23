package com.marsella.exam.repository;

import com.marsella.exam.model.Quiz;
import com.marsella.exam.model.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByQuizOrderByQuestionOrderAsc(Quiz quiz);
}

