package com.marsella.exam.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePeriodWeightsRequest {

    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isCurrent;

    private Double periodWeight; // Peso del bloque en la calificación final anual
    private Double examWeight;
    private Double activityWeight;
    private Double attendanceWeight;
    private Double conductWeight;
    private Double targetScale;
}
