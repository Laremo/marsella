package com.marsella.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnualGradebookDto {

    private Long schoolGroupId;
    private String groupName;
    private String grade;
    private String subject;
    private String schoolYear;
    private List<PeriodColumnInfo> periods;
    private List<AnnualStudentRow> rows;
    private double groupAverage;
    private int approvedCount;
    private int failedCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodColumnInfo {
        private Long periodId;
        private String name;
        private Integer periodNumber;
        private Double periodWeight; // % de la calificación final total (ej. 33.3%, 20%, 40%)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnnualStudentRow {
        private Long studentId;
        private String studentName;
        private Integer listNumber;
        private Map<Long, Double> periodGrades; // periodId -> calificación en ese bloque
        private double finalAnnualGrade; // Calificación ponderada final del ciclo
        private boolean isApproved;
    }
}
