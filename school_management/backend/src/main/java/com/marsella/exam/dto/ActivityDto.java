package com.marsella.exam.dto;

import com.marsella.exam.model.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class ActivityDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityRequest {
        @NotNull(message = "El período es obligatorio")
        private Long academicPeriodId;

        @NotBlank(message = "El título de la actividad es obligatorio")
        private String title;

        private String description;

        @NotNull(message = "El tipo de actividad es obligatorio")
        private ActivityType type;

        @NotNull(message = "El puntaje máximo es obligatorio")
        private Double maxPoints;

        private LocalDate dueDate;
        private Boolean isExtraPoints;
        private Long evaluationWeightId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityResponse {
        private Long id;
        private Long schoolGroupId;
        private Long academicPeriodId;
        private String periodName;
        private String title;
        private String description;
        private ActivityType type;
        private String typeLabel;
        private Double maxPoints;
        private LocalDate dueDate;
        private Boolean isExtraPoints;
        private Long evaluationWeightId;
        private String evaluationWeightName;
        private int gradedCount;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentScoreItem {
        @NotNull
        private Long studentId;
        private String studentName;
        private Integer listNumber;
        private Double score;
        private String feedback;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveBatchScoresRequest {
        @NotNull
        private List<StudentScoreItem> scores;
    }
}
