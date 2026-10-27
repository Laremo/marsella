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

    private PeriodType periodType;
    private Integer totalPeriods; // Cantidad de períodos
    private java.util.List<String> periodNames; // Nombres personalizados para cada período
    private String description;
}
