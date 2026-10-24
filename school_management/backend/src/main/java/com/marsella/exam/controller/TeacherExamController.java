package com.marsella.exam.controller;

import com.marsella.exam.dto.*;
import com.marsella.exam.model.User;
import com.marsella.exam.service.ExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/teacher/exams")
@RequiredArgsConstructor
@Slf4j
public class TeacherExamController {

    private final ExamService examService;

    @GetMapping
    public ResponseEntity<List<ExamResponse>> getExams(@AuthenticationPrincipal User teacher) {
        return ResponseEntity.ok(examService.getTeacherExams(teacher.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getExam(@AuthenticationPrincipal User teacher, @PathVariable Long id) {
        try {
            return ResponseEntity.ok(examService.getTeacherExam(teacher.getId(), id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createExam(@AuthenticationPrincipal User teacher, @Valid @RequestBody ExamRequest request) {
        try {
            ExamResponse created = examService.createExam(teacher, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<?> cloneExam(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id,
            @RequestBody(required = false) CloneExamRequest request) {
        try {
            ExamResponse cloned = examService.cloneExam(teacher, id, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(cloned);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error al clonar el examen {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al clonar el examen: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExam(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id,
            @Valid @RequestBody ExamRequest request) {
        try {
            ExamResponse updated = examService.updateExam(teacher.getId(), id, request);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExam(@AuthenticationPrincipal User teacher, @PathVariable Long id) {
        try {
            examService.deleteExam(teacher.getId(), id);
            Map<String, String> res = new HashMap<>();
            res.put("message", "Examen eliminado con éxito");
            return ResponseEntity.ok(res);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al eliminar el examen: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/submissions")
    public ResponseEntity<?> getSubmissions(@AuthenticationPrincipal User teacher, @PathVariable Long id) {
        try {
            return ResponseEntity.ok(examService.getExamSubmissions(teacher.getId(), id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/submissions/{submissionId}")
    public ResponseEntity<?> getSubmissionDetail(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id,
            @PathVariable Long submissionId) {
        try {
            return ResponseEntity.ok(examService.getSubmissionDetail(teacher.getId(), id, submissionId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/submissions/export")
    public ResponseEntity<byte[]> exportSubmissionsExcel(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id) {
        try {
            byte[] excelBytes = examService.exportSubmissionsToExcel(teacher.getId(), id);
            String filename = examService.getExamExportFilename(teacher.getId(), id);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(excelBytes);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            log.error("Error al exportar calificaciones en Excel para examen {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/recalculate-grades")
    public ResponseEntity<?> recalculateGrades(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id) {
        try {
            int updated = examService.regradeExamSubmissions(teacher.getId(), id);
            return ResponseEntity.ok(Map.of(
                    "message", "Calificaciones recalculadas con éxito",
                    "updatedSubmissions", updated
            ));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error al recalcular calificaciones para el examen {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al recalcular calificaciones: " + e.getMessage()));
        }
    }
}
