package com.marsella.exam.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(nullable = false)
    private Integer questionOrder;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private QuestionType type;

    @Column(nullable = false)
    private Double points;

    /**
     * JSON payload with options or setup for the student to see (e.g. choices, column items)
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionData;

    /**
     * JSON payload with the expected correct answers, used strictly by the backend for grading.
     * Never sent to student endpoints!
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String correctAnswer;
}
