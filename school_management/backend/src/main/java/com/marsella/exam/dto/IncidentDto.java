package com.marsella.exam.dto;

import com.marsella.exam.model.IncidentSeverity;
import com.marsella.exam.model.IncidentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentDto {

    private Long id;

    @NotNull(message = "El alumno es obligatorio")
    private Long studentId;

    private String studentName;

    private Long academicPeriodId;

    private String periodName;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDate date;

    @NotNull(message = "El tipo de incidencia es obligatorio")
    private IncidentType type;

    private String typeLabel;

    @NotNull(message = "La gravedad es obligatoria")
    private IncidentSeverity severity;

    private String severityLabel;

    @NotBlank(message = "El título o motivo es obligatorio")
    private String title;

    private String description;

    private Double pointDeduction;

    private LocalDateTime createdAt;
}
