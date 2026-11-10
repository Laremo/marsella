package com.marsella.exam.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuizOptionDto {
    private String id;
    private String text;
    private String color;
    private String shape;
    private Boolean isCorrect;
    private Integer responseCount;

    public QuizOptionDto(String id, String text, String color, String shape, Boolean isCorrect) {
        this.id = id;
        this.text = text;
        this.color = color;
        this.shape = shape;
        this.isCorrect = isCorrect;
    }
}

