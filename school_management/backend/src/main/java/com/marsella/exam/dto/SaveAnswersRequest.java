package com.marsella.exam.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SaveAnswersRequest {
    @NotBlank(message = "Answers JSON is required")
    private String answersJson;
}
