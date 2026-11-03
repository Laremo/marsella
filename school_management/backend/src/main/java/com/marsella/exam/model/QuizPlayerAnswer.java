package com.marsella.exam.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_player_answers", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"player_id", "question_index"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizPlayerAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private QuizPlayer player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private LiveQuizSession session;

    @Column(name = "question_index", nullable = false)
    private Integer questionIndex;

    @Column(length = 32)
    private String selectedOptionId;

    @Column(nullable = false)
    private Boolean isCorrect;

    @Column(nullable = false)
    private Long responseTimeMs;

    @Builder.Default
    @Column(nullable = false)
    private Integer pointsAwarded = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer streakBonus = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer streakCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private Long submittedAt = System.currentTimeMillis();
}
