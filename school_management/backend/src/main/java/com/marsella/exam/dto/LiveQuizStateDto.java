package com.marsella.exam.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LiveQuizStateDto {
    private String pin;
    private Long quizId;
    private String quizTitle;
    private Long schoolGroupId;
    private String schoolGroupName;
    private String status;
    private Integer currentQuestionIndex;
    private Integer totalQuestions;
    private Boolean isLastQuestion;
    private QuizQuestionDto currentQuestion;
    private Long timeRemainingMs;
    private Integer totalTimeLimitSeconds;
    private Integer connectedPlayersCount;
    private Integer totalAnsweredCount;
    private List<QuizPlayerSummaryDto> players;
    private List<QuizPlayerSummaryDto> topPlayers;
    private Map<String, Integer> optionStats;
    private List<StudentRosterDto> groupRoster;

    public Integer getPlayerCount() {
        return connectedPlayersCount != null ? connectedPlayersCount : (players != null ? players.size() : 0);
    }
}

