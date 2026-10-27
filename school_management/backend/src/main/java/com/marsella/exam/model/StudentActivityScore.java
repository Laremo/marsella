package com.marsella.exam.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "student_activity_scores",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_activity", columnNames = {"student_id", "activity_id"})
    },
    indexes = {
        @Index(name = "idx_act_score_act", columnList = "activity_id"),
        @Index(name = "idx_act_score_std", columnList = "student_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentActivityScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    @JsonIgnore
    private AcademicActivity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    @Builder.Default
    private Double score = 0.0;

    @Column(length = 255)
    private String feedback;

    @UpdateTimestamp
    private LocalDateTime gradedAt;
}
