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
public class ExamCheckDto {
    private Long id;
    private String code;
    private String title;
    private String description;
    private String grade;
    private String groupName;
    private Integer block;
    private Double totalPoints;
    private Integer questionCount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private Boolean isOngoing;
    private String statusMessage;
}
