package com.marsella.exam.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDto {

    private Long id;

    @NotBlank(message = "El nombre completo del alumno es obligatorio")
    private String fullName;

    private String studentIdentifier; // CURP / Matrícula

    private Integer listNumber;

    private String notes;

    private Boolean active;

    private LocalDateTime createdAt;
}
