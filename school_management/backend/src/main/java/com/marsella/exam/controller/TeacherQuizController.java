package com.marsella.exam.controller;

import com.marsella.exam.dto.CreateQuizRequest;
import com.marsella.exam.dto.LiveQuizStateDto;
import com.marsella.exam.dto.QuizDto;
import com.marsella.exam.dto.QuizSessionReportDto;
import com.marsella.exam.model.User;
import com.marsella.exam.service.ExcelExportService;
import com.marsella.exam.service.LiveQuizService;
import com.marsella.exam.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teacher/quizzes")
@RequiredArgsConstructor
@Slf4j
public class TeacherQuizController {

    private final QuizService quizService;
    private final LiveQuizService liveQuizService;
    private final ExcelExportService excelExportService;

    @GetMapping
    public ResponseEntity<List<QuizDto>> getQuizzes(@AuthenticationPrincipal User teacher) {
        return ResponseEntity.ok(quizService.getQuizzesForTeacher(teacher));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizDto> getQuiz(@AuthenticationPrincipal User teacher, @PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizDtoById(id, teacher));
    }

    @PostMapping
    public ResponseEntity<QuizDto> createQuiz(
            @AuthenticationPrincipal User teacher,
            @Valid @RequestBody CreateQuizRequest request) {
        QuizDto created = quizService.createQuiz(request, teacher);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuizDto> updateQuiz(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id,
            @Valid @RequestBody CreateQuizRequest request) {
        QuizDto updated = quizService.updateQuiz(id, request, teacher);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteQuiz(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id) {
        quizService.deleteQuiz(id, teacher);
        return ResponseEntity.ok(Map.of("message", "Quiz eliminado exitosamente"));
    }

    @PostMapping("/{id}/launch")
    public ResponseEntity<LiveQuizStateDto> launchSession(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id,
            @RequestParam(required = false) Long schoolGroupId) {
        LiveQuizStateDto state = liveQuizService.createSession(id, schoolGroupId, teacher);
        return ResponseEntity.status(HttpStatus.CREATED).body(state);
    }

    @PostMapping("/live/{pin}/advance")
    public ResponseEntity<LiveQuizStateDto> advancePhase(
            @AuthenticationPrincipal User teacher,
            @PathVariable String pin) {
        LiveQuizStateDto state = liveQuizService.advancePhase(pin, teacher);
        return ResponseEntity.ok(state);
    }

    @GetMapping("/live/{pin}/report")
    public ResponseEntity<QuizSessionReportDto> getSessionReport(
            @AuthenticationPrincipal User teacher,
            @PathVariable String pin) {
        QuizSessionReportDto report = liveQuizService.getSessionReport(pin, teacher);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/live/{pin}/report/export")
    public ResponseEntity<byte[]> exportSessionReport(
            @AuthenticationPrincipal User teacher,
            @PathVariable String pin) throws IOException {
        QuizSessionReportDto report = liveQuizService.getSessionReport(pin, teacher);
        byte[] excelBytes = excelExportService.generateQuizReportExcel(report);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "reporte_quiz_" + pin + ".xlsx");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(excelBytes, headers, HttpStatus.OK);
    }
}
