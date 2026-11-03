package com.marsella.exam.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuizRequest {
    @NotBlank(message = "El título del quiz es obligatorio")
    private String title;
    private String description;
    private Long schoolGroupId;
    private Integer defaultTimeLimitSeconds;
    private Integer basePoints;
    private List<QuizQuestionDto> questions;
}
