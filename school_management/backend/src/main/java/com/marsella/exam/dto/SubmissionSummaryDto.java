package com.marsella.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionSummaryDto {
    private Long id;
    private String studentName;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime endDate;
    private Boolean isCompleted;
    private Boolean canViewScore;
    private Double score;
    private Double maxScore;
    private Double percentage;
    private String examTitle;
    private Integer block;
    private String grade;
    private String groupName;
}
