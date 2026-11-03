package com.marsella.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSessionReportDto {
    private String pin;
    private String quizTitle;
    private String schoolGroupName;
    private String teacherName;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer totalPlayers;
    private Integer totalQuestions;
    private Double averageScore;
    private Double globalAccuracyPercentage;
    private String hardestQuestionPrompt;
    private Double hardestQuestionAccuracy;
    private List<QuestionReportStat> questionStats;
    private List<PlayerRankingReportStat> playerRankings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionReportStat {
        private Integer questionOrder;
        private String prompt;
        private Integer correctAnswersCount;
        private Integer incorrectAnswersCount;
        private Integer unansweredCount;
        private Double accuracyPercentage;
        private Double averageResponseTimeSeconds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerRankingReportStat {
        private Integer rank;
        private String nickname;
        private String fullName;
        private Integer totalScore;
        private Integer correctCount;
        private Integer totalQuestions;
        private Double accuracyPercentage;
        private Integer highestStreak;
    }
}

