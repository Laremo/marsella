package com.marsella.exam.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "student_submissions",
    indexes = {
        @Index(name = "idx_exam_student", columnList = "exam_id, student_name")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "student_name", nullable = false, length = 150)
    private String studentName;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt;

    private LocalDateTime submittedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCompleted = false;

    @Builder.Default
    private Double score = 0.0;

    @Builder.Default
    private Double maxScore = 0.0;

    /**
     * Stored JSON string of the student's current answers.
     * Auto-saved in progress, used when resuming the exam.
     */
    @Column(columnDefinition = "TEXT")
    private String answersJson;

    /**
     * Stored JSON breakdown of grading details (per question points, correct answers, student answers)
     */
    @Column(columnDefinition = "TEXT")
    private String gradingDetailsJson;
}
