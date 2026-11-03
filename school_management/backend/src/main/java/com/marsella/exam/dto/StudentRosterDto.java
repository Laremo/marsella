package com.marsella.exam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentRosterDto {
    private Long studentId;
    private String fullName;
    private Integer listNumber;
    private Boolean hasJoined;
    private String nickname;
    private String avatar;
}

