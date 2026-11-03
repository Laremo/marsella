package com.marsella.exam.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitQuizAnswerRequest {
    @NotBlank(message = "El token del jugador es obligatorio")
    private String playerToken;

    @NotBlank(message = "Debes seleccionar una opción")
    private String selectedOptionId;
}
