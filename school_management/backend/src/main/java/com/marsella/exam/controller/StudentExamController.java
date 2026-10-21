package com.marsella.exam.controller;

import com.marsella.exam.dto.JoinExamRequest;
import com.marsella.exam.dto.SaveAnswersRequest;
import com.marsella.exam.dto.StudentExamSessionResponse;
import com.marsella.exam.dto.SubmissionSummaryDto;
import com.marsella.exam.dto.SubmitExamRequest;
import com.marsella.exam.service.StudentExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/student/exams")
@RequiredArgsConstructor
public class StudentExamController {

    private final StudentExamService studentExamService;

    @GetMapping("/check/{code}")
    public ResponseEntity<?> checkExam(@PathVariable String code) {
        try {
            return ResponseEntity.ok(studentExamService.checkExamCode(code));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinExam(@Valid @RequestBody JoinExamRequest request) {
        try {
            StudentExamSessionResponse session = studentExamService.joinOrResumeExam(request);
            return ResponseEntity.ok(session);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{submissionId}/save")
    public ResponseEntity<?> saveAnswers(
            @PathVariable Long submissionId,
            @Valid @RequestBody SaveAnswersRequest request) {
        try {
            studentExamService.saveAnswers(submissionId, request);
            return ResponseEntity.ok(Map.of("message", "Respuestas guardadas automáticamente"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{submissionId}/submit")
    public ResponseEntity<?> submitExam(
            @PathVariable Long submissionId,
            @RequestBody(required = false) SubmitExamRequest request) {
        try {
            SubmissionSummaryDto result = studentExamService.submitExam(submissionId, request);
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{submissionId}")
    public ResponseEntity<?> getSubmissionStatus(@PathVariable Long submissionId) {
        try {
            return ResponseEntity.ok(studentExamService.getSubmissionStatus(submissionId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
