package com.marsella.exam.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(nullable = false)
    private Integer questionOrder;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(length = 1024)
    private String imageUrl;

    @Builder.Default
    @Column(nullable = false)
    private Integer timeLimitSeconds = 15;

    @Builder.Default
    @Column(nullable = false)
    private Integer points = 1000;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionsJson;

    @Column(columnDefinition = "TEXT")
    private String explanation;
}
