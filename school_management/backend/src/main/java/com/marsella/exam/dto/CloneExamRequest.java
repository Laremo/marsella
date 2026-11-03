package com.marsella.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloneExamRequest {
    private String title;
    private String grade;
    private String groupName;
    private Integer block;
    private String code;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
}
