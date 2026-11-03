package com.marsella.exam.repository;

import com.marsella.exam.model.LiveQuizSession;
import com.marsella.exam.model.QuizPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizPlayerRepository extends JpaRepository<QuizPlayer, Long> {
    Optional<QuizPlayer> findBySessionAndSessionToken(LiveQuizSession session, String sessionToken);
    Optional<QuizPlayer> findBySessionAndNicknameIgnoreCase(LiveQuizSession session, String nickname);
    List<QuizPlayer> findBySessionOrderByTotalScoreDesc(LiveQuizSession session);
    List<QuizPlayer> findBySessionId(Long sessionId);
}

