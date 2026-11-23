package com.marsella.exam.repository;

import com.marsella.exam.model.LiveQuizSession;
import com.marsella.exam.model.QuizPlayer;
import com.marsella.exam.model.QuizPlayerAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizPlayerAnswerRepository extends JpaRepository<QuizPlayerAnswer, Long> {
    Optional<QuizPlayerAnswer> findByPlayerAndQuestionIndex(QuizPlayer player, Integer questionIndex);
    List<QuizPlayerAnswer> findBySessionAndQuestionIndex(LiveQuizSession session, Integer questionIndex);
    List<QuizPlayerAnswer> findBySession(LiveQuizSession session);
    List<QuizPlayerAnswer> findByPlayer(QuizPlayer player);
    long countBySessionAndQuestionIndex(LiveQuizSession session, Integer questionIndex);
}

