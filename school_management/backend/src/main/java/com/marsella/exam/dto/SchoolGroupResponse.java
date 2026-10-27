package com.marsella.exam.dto;

import com.marsella.exam.model.PeriodType;
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
public class SchoolGroupResponse {

    private Long id;
    private String name;
    private String grade;
    private String subject;
    private String shift;
    private String schoolYear;
    private PeriodType periodType;
    private String periodTypeLabel;
    private Integer totalPeriods;
    private String description;
    private int studentCount;
    private List<AcademicPeriodDto> periods;
    private List<GroupEvaluationWeightDto> evaluationWeights;
    private LocalDateTime createdAt;
}
