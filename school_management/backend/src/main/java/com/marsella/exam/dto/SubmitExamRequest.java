package com.marsella.exam.dto;

import lombok.Data;

@Data
public class SubmitExamRequest {
    // Optional: final answers sent at submission time (if null, uses currently saved answers)
    private String answersJson;
}
