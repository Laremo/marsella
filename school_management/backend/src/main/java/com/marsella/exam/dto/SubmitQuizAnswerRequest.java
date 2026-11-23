package com.marsella.exam.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
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

    @JsonAlias({"selectedOption", "optionId", "option"})
    private String selectedOptionId;

    private Long questionId;
    private Long clientResponseTimeMs;

    public String getSelectedOptionId() {
        return selectedOptionId != null ? selectedOptionId.trim() : null;
    }
}

