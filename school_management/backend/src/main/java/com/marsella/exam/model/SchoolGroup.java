package com.marsella.exam.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "school_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    @JsonIgnore
    private User teacher;

    @Column(nullable = false, length = 100)
    private String name; // e.g. "Grupo A", "Grupo B"

    @Column(nullable = false, length = 50)
    private String grade; // e.g. "1ro", "2do", "3ro", "6to"

    @Column(length = 100)
    private String subject; // e.g. "Tecnología e Informática", "Ciencias"

    @Column(length = 50)
    @Builder.Default
    private String shift = "Matutino"; // "Matutino", "Vespertino"

    @Column(length = 50)
    @Builder.Default
    private String schoolYear = "2026-2027";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private PeriodType periodType = PeriodType.TRIMESTRE;

    @Column(nullable = false)
    @Builder.Default
    private Integer totalPeriods = 3;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "schoolGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("periodNumber ASC")
    @Builder.Default
    private List<AcademicPeriod> periods = new ArrayList<>();

    @OneToMany(mappedBy = "schoolGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    @Builder.Default
    private List<GroupEvaluationWeight> evaluationWeights = new ArrayList<>();

    @OneToMany(mappedBy = "schoolGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("fullName ASC")
    @JsonIgnore
    @Builder.Default
    private List<Student> students = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
