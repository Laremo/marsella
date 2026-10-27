package com.marsella.exam.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "student_incidents",
    indexes = {
        @Index(name = "idx_inc_student", columnList = "student_id"),
        @Index(name = "idx_inc_group", columnList = "school_group_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_group_id", nullable = false)
    @JsonIgnore
    private SchoolGroup schoolGroup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_period_id")
    @JsonIgnore
    private AcademicPeriod academicPeriod;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private IncidentType type = IncidentType.LLAMADO_ATENCION;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private IncidentSeverity severity = IncidentSeverity.LEVE;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Double pointDeduction = 0.0; // Puntos que resta a la calificación si aplica

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
