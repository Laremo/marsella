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
public class QuizDto {
    private Long id;
    private String title;
    private String description;
    private Long schoolGroupId;
    private String schoolGroupName;
    private Integer defaultTimeLimitSeconds;
    private Integer basePoints;
    private Integer questionCount;
    private LocalDateTime createdAt;
    private List<QuizQuestionDto> questions;
}
