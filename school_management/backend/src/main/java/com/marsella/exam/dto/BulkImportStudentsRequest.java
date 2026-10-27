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
public class BulkImportStudentsRequest {

    /**
     * Optional ID of an already applied exam to import students from.
     * All distinct student names who submitted will be extracted.
     */
    private Long sourceExamId;

    /**
     * Optional raw multiline text or list of student names.
     */
    private String rawNamesText;

    private List<String> studentNames;
}
