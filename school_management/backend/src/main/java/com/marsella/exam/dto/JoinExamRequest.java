package com.marsella.exam.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinExamRequest {
    @NotBlank(message = "Exam code is required")
    private String code;

    @NotBlank(message = "Student name is required")
    private String studentName;
}
