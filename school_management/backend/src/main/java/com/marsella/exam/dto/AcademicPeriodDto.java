package com.marsella.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademicPeriodDto {

    private Long id;
    private Integer periodNumber;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isCurrent;

    // Weights
    private Double examWeight;
    private Double activityWeight;
    private Double attendanceWeight;
    private Double conductWeight;
    private Double targetScale;
}
