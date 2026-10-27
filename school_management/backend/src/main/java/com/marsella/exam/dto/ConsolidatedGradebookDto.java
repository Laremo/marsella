package com.marsella.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsolidatedGradebookDto {

    private Long schoolGroupId;
    private String groupName;
    private String grade;
    private String subject;
    private Long academicPeriodId;
    private String periodName;

    // Weights
    private Double examWeight;
    private Double activityWeight;
    private Double attendanceWeight;
    private Double targetScale;

    // Group Statistics
    private int totalStudents;
    private double groupAverage;
    private int approvedCount;
    private int failedCount;

    private List<StudentGradeRow> rows;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentGradeRow {
        private Long studentId;
        private String studentName;
        private Integer listNumber;

        // Exams Component
        private double examsAverage; // 0 - 10
        private double examsPoints;  // Ponderado

        // Activities Component
        private double activitiesAverage; // 0 - 10
        private double activitiesPoints;  // Ponderado

        // Attendance Component
        private double attendancePercentage; // e.g. 95%
        private double attendancePoints;     // Ponderado

        // Bonus and Penalties
        private double extraPoints;      // Puntos extra (+0.5, +1.0)
        private double conductPenalties; // Puntos restados (-0.5)

        // Final Calculated Grade
        private double finalGrade; // e.g. 9.4 / 10.0
        private boolean isApproved; // >= 6.0
    }
}
