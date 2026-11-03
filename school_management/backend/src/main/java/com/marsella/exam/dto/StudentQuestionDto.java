package com.marsella.exam.dto;

import com.marsella.exam.model.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentQuestionDto {
    private Long id;
    private Integer questionOrder;
    private String prompt;
    private QuestionType type;
    private Double points;
    private String questionData;
}
