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
public class JoinQuizRequest {
    @NotBlank(message = "El PIN es obligatorio")
    private String pin;

    @NotBlank(message = "El apodo o nombre es obligatorio")
    private String nickname;

    private Long studentId;
    private String avatar;
    private String playerToken;
}
