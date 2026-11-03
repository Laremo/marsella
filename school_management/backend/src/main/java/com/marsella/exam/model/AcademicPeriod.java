package com.marsella.exam.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "academic_periods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_group_id", nullable = false)
    @JsonIgnore
    private SchoolGroup schoolGroup;

    @Column(nullable = false)
    private Integer periodNumber; // 1, 2, 3...

    @Column(nullable = false, length = 100)
    private String name; // e.g. "Trimestre 1", "Bloque 2"

    private LocalDate startDate;

    private LocalDate endDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCurrent = false;

    /**
     * Peso / porcentaje de este bloque en la calificación final anual/total del curso (ej. 33.3%, 20%, 40%)
     */
    @Column(name = "period_weight")
    @Builder.Default
    private Double periodWeight = 100.0;

    // --- Ponderaciones / Evaluation Weights (Percentages summing to 100) ---

    @Column(nullable = false)
    @Builder.Default
    private Double examWeight = 40.0; // 40%

    @Column(nullable = false)
    @Builder.Default
    private Double activityWeight = 40.0; // 40% (Tareas, proyectos, prácticas)

    @Column(nullable = false)
    @Builder.Default
    private Double attendanceWeight = 20.0; // 20% (Asistencia)

    @Column(nullable = false)
    @Builder.Default
    private Double conductWeight = 0.0; // Conducta / penalización opcional

    @Column(nullable = false)
    @Builder.Default
    private Double targetScale = 10.0; // Calificación máxima: 10 o 100
}
