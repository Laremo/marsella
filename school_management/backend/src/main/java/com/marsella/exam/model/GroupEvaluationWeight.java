package com.marsella.exam.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "group_evaluation_weights")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupEvaluationWeight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_group_id", nullable = false)
    @JsonIgnore
    private SchoolGroup schoolGroup;

    @Column(nullable = false, length = 100)
    private String name; // e.g. "Exámenes", "Tareas y Trabajos", "Asistencia", "Proyecto"

    @Column(nullable = false)
    private Double percentage; // e.g. 40.0, 30.0, 20.0

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EvaluationCategory category = EvaluationCategory.ACTIVIDAD;
}
