package com.marsella.exam.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizQuestionDto {
    private Long id;
    private Integer questionOrder;
    private String prompt;
    private String imageUrl;
    private Integer timeLimitSeconds;
    private Integer points;
    private List<QuizOptionDto> options;
    private String explanation;
}
