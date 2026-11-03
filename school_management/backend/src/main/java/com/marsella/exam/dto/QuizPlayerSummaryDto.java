package com.marsella.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizPlayerSummaryDto {
    private Long id;
    private String nickname;
    private Long studentId;
    private String studentName;
    private String avatar;
    private Integer totalScore;
    private Integer currentStreak;
    private Integer rank;
    private Boolean isConnected;
    private Boolean hasAnsweredCurrentQuestion;
    private Integer lastPointsAwarded;
    private Integer lastStreakBonus;
    private Boolean lastAnswerCorrect;
    private Long lastResponseTimeMs;
}

