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
public class SubmissionDetailDto {
    private Long id;
    private Long examId;
    private String examTitle;
    private String studentName;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Boolean isCompleted;
    private Double score;
    private Double maxScore;
    private Double percentage;
    private List<QuestionResultDto> questionResults;
}
