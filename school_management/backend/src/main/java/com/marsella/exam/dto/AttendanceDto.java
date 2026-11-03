package com.marsella.exam.dto;

import com.marsella.exam.model.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

public class AttendanceDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttendanceItem {
        @NotNull
        private Long studentId;
        private String studentName;
        private Integer listNumber;
        private AttendanceStatus status; // PRESENT, ABSENT, LATE, JUSTIFIED
        private String remarks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyAttendanceRequest {
        @NotNull(message = "La fecha es obligatoria")
        private LocalDate date;

        private Long academicPeriodId;

        @NotNull(message = "La lista de asistencia es obligatoria")
        private List<StudentAttendanceItem> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttendanceSummary {
        private Long studentId;
        private String studentName;
        private Integer listNumber;
        private int totalDays;
        private int presentCount;
        private int absentCount;
        private int lateCount;
        private int justifiedCount;
        private double attendancePercentage; // e.g. 95.0%
        private double pointsAwarded; // Based on period attendanceWeight
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GroupAttendanceOverview {
        private LocalDate date;
        private int totalEnrolled;
        private int present;
        private int absent;
        private int late;
        private int justified;
        private List<StudentAttendanceItem> records;
    }
}
