package com.marsella.exam.dto;

import com.marsella.exam.model.QuestionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {
    private Long id;

    private Integer questionOrder;

    @NotBlank(message = "Question prompt is required")
    private String prompt;

    @NotNull(message = "Question type is required")
    private QuestionType type;

    @NotNull(message = "Points value is required")
    @Min(value = 0, message = "Points must be at least 0")
    private Double points;

    @NotBlank(message = "Question configuration data is required")
    private String questionData;

    @NotBlank(message = "Correct answer is required")
    private String correctAnswer;
}
