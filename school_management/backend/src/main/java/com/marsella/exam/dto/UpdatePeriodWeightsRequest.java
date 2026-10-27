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

    @NotNull(message = "El peso del examen es obligatorio")
    private Double examWeight;

    @NotNull(message = "El peso de actividades es obligatorio")
    private Double activityWeight;

    @NotNull(message = "El peso de asistencia es obligatorio")
    private Double attendanceWeight;

    private Double conductWeight;
    private Double targetScale;
}
