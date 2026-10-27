package com.marsella.exam.dto;

import com.marsella.exam.model.PeriodType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolGroupRequest {

    @NotBlank(message = "El nombre del grupo es obligatorio")
    private String name; // e.g. "Grupo A"

    @NotBlank(message = "El grado es obligatorio")
    private String grade; // e.g. "1ro", "2do", "3ro"

    private String subject; // e.g. "Tecnología", "Historia"

    private String shift; // "Matutino", "Vespertino"

    private String schoolYear; // "2026-2027"

    @NotNull(message = "El tipo de período es obligatorio")
    private PeriodType periodType;

    private Integer totalPeriods; // Cantidad de períodos (e.g. 3 para trimestres, 5 para bloques)

    private String description;
}
