package com.marsella.exam.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "academic_activities",
    indexes = {
        @Index(name = "idx_act_group", columnList = "school_group_id"),
        @Index(name = "idx_act_period", columnList = "academic_period_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_group_id", nullable = false)
    @JsonIgnore
    private SchoolGroup schoolGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_period_id", nullable = false)
    @JsonIgnore
    private AcademicPeriod academicPeriod;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private ActivityType type = ActivityType.TAREA;

    @Column(nullable = false)
    @Builder.Default
    private Double maxPoints = 10.0;

    private LocalDate dueDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isExtraPoints = false; // True si suma directo como bono / puntos extra

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
