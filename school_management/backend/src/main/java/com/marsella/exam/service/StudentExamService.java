package com.marsella.exam.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marsella.exam.dto.*;
import com.marsella.exam.model.Exam;
import com.marsella.exam.model.StudentSubmission;
import com.marsella.exam.repository.ExamRepository;
import com.marsella.exam.repository.StudentSubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentExamService {

    private final ExamRepository examRepository;
    private final StudentSubmissionRepository submissionRepository;
    private final GradingService gradingService;
    private final ObjectMapper objectMapper;

    @Transactional
    public StudentExamSessionResponse joinOrResumeExam(JoinExamRequest request) {
        String code = request.getCode().trim();
        String studentName = request.getStudentName().trim();

        Exam exam = examRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new NoSuchElementException("No se encontró ningún examen con el código: " + code));

        if (!Boolean.TRUE.equals(exam.getIsActive())) {
            throw new IllegalStateException("Este examen actualmente no está activo.");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(exam.getStartDate())) {
            throw new IllegalStateException("El examen aún no ha iniciado. Estará disponible a partir de: " + exam.getStartDate());
        }
        if (now.isAfter(exam.getEndDate())) {
            throw new IllegalStateException("El período para presentar este examen ha finalizado.");
        }

        Optional<StudentSubmission> existingOpt = submissionRepository
                .findByExamIdAndStudentNameIgnoreCase(exam.getId(), studentName);

        StudentSubmission submission;
        String status;

        if (existingOpt.isPresent()) {
            submission = existingOpt.get();
            if (Boolean.TRUE.equals(submission.getIsCompleted())) {
                status = "ALREADY_SUBMITTED";
            } else {
                status = "RESUMED";
            }
        } else {
            submission = StudentSubmission.builder()
                    .exam(exam)
                    .studentName(studentName)
                    .isCompleted(false)
                    .score(0.0)
                    .maxScore(exam.getTotalPoints())
                    .answersJson("{}")
                    .build();
            submission = submissionRepository.save(submission);
            status = "NEW";
        }

        List<StudentQuestionDto> studentQuestions = exam.getQuestions().stream().map(q ->
                StudentQuestionDto.builder()
                        .id(q.getId())
                        .questionOrder(q.getQuestionOrder())
                        .prompt(q.getPrompt())
                        .type(q.getType())
                        .points(q.getPoints())
                        .questionData(q.getQuestionData())
                        .build()
        ).collect(Collectors.toList());

        boolean isExamClosed = LocalDateTime.now().isAfter(exam.getEndDate()) || Boolean.FALSE.equals(exam.getIsActive());

        return StudentExamSessionResponse.builder()
                .submissionId(submission.getId())
                .examId(exam.getId())
                .examCode(exam.getCode())
                .examTitle(exam.getTitle())
                .examDescription(exam.getDescription())
                .grade(exam.getGrade() != null ? exam.getGrade() : resolveGrade(exam))
                .groupName(exam.getGroupName() != null ? exam.getGroupName() : "A")
                .block(exam.getBlock() != null ? exam.getBlock() : resolveBlock(exam))
                .studentName(submission.getStudentName())
                .startDate(exam.getStartDate())
                .endDate(exam.getEndDate())
                .totalPoints(exam.getTotalPoints())
                .isCompleted(submission.getIsCompleted())
                .score(isExamClosed ? submission.getScore() : null)
                .canViewScore(isExamClosed)
                .status(status)
                .savedAnswersJson(submission.getAnswersJson())
                .questions(studentQuestions)
                .build();
    }

    @Transactional(readOnly = true)
    public ExamCheckDto checkExamCode(String rawCode) {
        if (rawCode == null || rawCode.trim().isEmpty()) {
            throw new IllegalArgumentException("El código no puede estar vacío");
        }
        String code = rawCode.trim();

        Exam exam = examRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new NoSuchElementException("No se encontró ningún examen con el código: " + code));

        if (!Boolean.TRUE.equals(exam.getIsActive())) {
            throw new IllegalStateException("Este examen actualmente no está activo por el docente.");
        }

        LocalDateTime now = LocalDateTime.now();
        String statusMessage = "DISPONIBLE";
        if (now.isBefore(exam.getStartDate())) {
            statusMessage = "PROGRAMADO (Inicia: " + exam.getStartDate() + ")";
        } else if (now.isAfter(exam.getEndDate())) {
            statusMessage = "FINALIZADO";
        }

        Integer block = exam.getBlock() != null ? exam.getBlock() : resolveBlock(exam);
        String grade = exam.getGrade() != null ? exam.getGrade() : resolveGrade(exam);
        String group = exam.getGroupName() != null ? exam.getGroupName() : "A";

        return ExamCheckDto.builder()
                .id(exam.getId())
                .code(exam.getCode())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .grade(grade)
                .groupName(group)
                .block(block)
                .totalPoints(exam.getTotalPoints())
                .questionCount(exam.getQuestions() != null ? exam.getQuestions().size() : 0)
                .startDate(exam.getStartDate())
                .endDate(exam.getEndDate())
                .isActive(exam.getIsActive())
                .isOngoing(exam.isOngoing())
                .statusMessage(statusMessage)
                .build();
    }

    private Integer resolveBlock(Exam exam) {
        if (exam.getBlock() != null) return exam.getBlock();
        String text = (exam.getTitle() + " " + (exam.getDescription() != null ? exam.getDescription() : "")).toLowerCase();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("bloque\\s*(\\d+)").matcher(text);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (Exception ignored) {}
        }
        return 1;
    }

    private String resolveGrade(Exam exam) {
        if (exam.getGrade() != null && !exam.getGrade().isBlank()) return exam.getGrade();
        String text = (exam.getTitle() + " " + (exam.getDescription() != null ? exam.getDescription() : "")).toLowerCase();
        if (text.contains("2do") || text.contains("segundo")) return "2do";
        if (text.contains("6to") || text.contains("sexto")) return "6to";
        if (text.contains("1er") || text.contains("primer")) return "1er";
        if (text.contains("3er") || text.contains("tercer")) return "3er";
        if (text.contains("4to") || text.contains("cuarto")) return "4to";
        if (text.contains("5to") || text.contains("quinto")) return "5to";
        return "2do";
    }

    @Transactional
    public void saveAnswers(Long submissionId, SaveAnswersRequest request) {
        StudentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Sesión de examen no encontrada"));

        if (Boolean.TRUE.equals(submission.getIsCompleted())) {
            throw new IllegalStateException("El examen ya ha sido finalizado y entregado.");
        }

        if (LocalDateTime.now().isAfter(submission.getExam().getEndDate())) {
            throw new IllegalStateException("El tiempo límite del examen ha concluido.");
        }

        submission.setAnswersJson(request.getAnswersJson());
        submissionRepository.save(submission);
    }

    @Transactional
    public SubmissionSummaryDto submitExam(Long submissionId, SubmitExamRequest request) {
        StudentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Sesión de examen no encontrada"));

        if (Boolean.TRUE.equals(submission.getIsCompleted())) {
            throw new IllegalStateException("El examen ya ha sido entregado previamente.");
        }

        if (request != null && request.getAnswersJson() != null && !request.getAnswersJson().isBlank()) {
            submission.setAnswersJson(request.getAnswersJson());
        }

        GradingService.GradingOutput grading = gradingService.gradeSubmission(submission);

        try {
            submission.setGradingDetailsJson(objectMapper.writeValueAsString(grading.results));
        } catch (Exception e) {
            log.error("Failed to serialize grading results", e);
        }

        submission.setScore(grading.totalScore);
        submission.setMaxScore(grading.maxScore);
        submission.setIsCompleted(true);
        submission.setSubmittedAt(LocalDateTime.now());
        StudentSubmission saved = submissionRepository.save(submission);

        Exam exam = submission.getExam();
        boolean isExamClosed = LocalDateTime.now().isAfter(exam.getEndDate()) || Boolean.FALSE.equals(exam.getIsActive());

        double scoreVal = saved.getScore() != null ? saved.getScore() : 0.0;
        double maxScoreVal = saved.getMaxScore() != null ? saved.getMaxScore() : 0.0;
        double pct = (maxScoreVal > 0)
                ? Math.round((scoreVal / maxScoreVal) * 100.0 * 10.0) / 10.0
                : 0.0;

        return SubmissionSummaryDto.builder()
                .id(saved.getId())
                .studentName(saved.getStudentName())
                .startedAt(saved.getStartedAt())
                .submittedAt(saved.getSubmittedAt())
                .endDate(exam.getEndDate())
                .examTitle(exam.getTitle())
                .block(exam.getBlock() != null ? exam.getBlock() : resolveBlock(exam))
                .grade(exam.getGrade() != null ? exam.getGrade() : resolveGrade(exam))
                .groupName(exam.getGroupName() != null ? exam.getGroupName() : "A")
                .isCompleted(saved.getIsCompleted())
                .canViewScore(isExamClosed)
                .score(isExamClosed ? saved.getScore() : null)
                .maxScore(maxScoreVal)
                .percentage(isExamClosed ? pct : null)
                .build();
    }

    @Transactional(readOnly = true)
    public SubmissionSummaryDto getSubmissionStatus(Long submissionId) {
        StudentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Sesión de examen no encontrada"));

        Exam exam = submission.getExam();
        boolean isExamClosed = LocalDateTime.now().isAfter(exam.getEndDate()) || Boolean.FALSE.equals(exam.getIsActive());

        double scoreVal = submission.getScore() != null ? submission.getScore() : 0.0;
        double maxScoreVal = submission.getMaxScore() != null ? submission.getMaxScore() : 0.0;
        double pct = (maxScoreVal > 0)
                ? Math.round((scoreVal / maxScoreVal) * 100.0 * 10.0) / 10.0
                : 0.0;

        return SubmissionSummaryDto.builder()
                .id(submission.getId())
                .studentName(submission.getStudentName())
                .startedAt(submission.getStartedAt())
                .submittedAt(submission.getSubmittedAt())
                .endDate(exam.getEndDate())
                .examTitle(exam.getTitle())
                .block(exam.getBlock() != null ? exam.getBlock() : resolveBlock(exam))
                .grade(exam.getGrade() != null ? exam.getGrade() : resolveGrade(exam))
                .groupName(exam.getGroupName() != null ? exam.getGroupName() : "A")
                .isCompleted(submission.getIsCompleted())
                .canViewScore(isExamClosed)
                .score(isExamClosed ? submission.getScore() : null)
                .maxScore(submission.getMaxScore())
                .percentage(isExamClosed ? pct : null)
                .build();
    }
}
