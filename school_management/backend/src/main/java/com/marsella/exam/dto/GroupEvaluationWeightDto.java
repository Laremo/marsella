package com.marsella.exam.dto;

import com.marsella.exam.model.EvaluationCategory;
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
public class GroupEvaluationWeightDto {
    private Long id;

    @NotBlank(message = "El nombre de la ponderación es obligatorio")
    private String name;

    @NotNull(message = "El porcentaje es obligatorio")
    private Double percentage;

    private EvaluationCategory category;
}
