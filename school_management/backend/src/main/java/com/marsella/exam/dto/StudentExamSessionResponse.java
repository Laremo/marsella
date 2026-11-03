package com.marsella.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamSessionResponse {
    private Long submissionId;
    private Long examId;
    private String examCode;
    private String examTitle;
    private String examDescription;
    private String grade;
    private String groupName;
    private Integer block;
    private String studentName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Double totalPoints;
    private Boolean isCompleted;
    private Double score;
    private Boolean canViewScore;
    private String status; // "NEW", "RESUMED", "ALREADY_SUBMITTED"
    private String savedAnswersJson;
    private List<StudentQuestionDto> questions;
}
