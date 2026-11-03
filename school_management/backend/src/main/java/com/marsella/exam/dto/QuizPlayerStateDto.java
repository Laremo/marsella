package com.marsella.exam.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizPlayerStateDto {
    private String playerToken;
    private Long playerId;
    private String nickname;
    private String avatar;
    private Integer totalScore;
    private Integer currentStreak;
    private Boolean isConnected;
    private Boolean hasAnsweredCurrentQuestion;
    private String selectedOptionId;
    private Boolean isCorrect;
    private Integer pointsAwarded;
    private Integer streakBonus;
    private Integer currentRank;
    private Integer scoreToNextRank;
}
