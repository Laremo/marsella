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
public class QuestionResultDto {
    private Long questionId;
    private Integer questionOrder;
    private String prompt;
    private QuestionType type;
    private Double maxPoints;
    private Double awardedPoints;
    private Boolean isCorrect;
    private Object studentAnswer;
    private Object correctAnswer;
    private String questionData;
}
