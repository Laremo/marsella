package com.marsella.exam.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_players", indexes = {
        @Index(name = "idx_player_session_token", columnList = "session_token")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private LiveQuizSession session;

    @Column(name = "session_token", nullable = false, length = 64)
    private String sessionToken;

    @Column(nullable = false, length = 64)
    private String nickname;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @Builder.Default
    @Column(nullable = false, length = 16)
    private String avatar = "🦊";

    @Builder.Default
    @Column(nullable = false)
    private Integer totalScore = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer currentStreak = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer highestStreak = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer correctAnswersCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer totalAnswersCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isConnected = true;

    @Builder.Default
    @Column(nullable = false)
    private Long lastActiveTime = System.currentTimeMillis();

    @Builder.Default
    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QuizPlayerAnswer> answers = new ArrayList<>();

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime joinedAt = LocalDateTime.now();
}

