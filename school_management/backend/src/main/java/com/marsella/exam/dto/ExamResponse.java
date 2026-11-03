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
public class ExamResponse {
    private Long id;
    private String code;
    private String title;
    private String description;
    private String grade;
    private String groupName;
    private Integer block;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Double totalPoints;
    private Boolean isActive;
    private Boolean isEditable;
    private Boolean isOngoing;
    private Long submissionCount;
    private Long completedCount;
    private List<QuestionDto> questions;
    private LocalDateTime createdAt;
}
