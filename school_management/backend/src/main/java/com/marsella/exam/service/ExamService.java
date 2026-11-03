package com.marsella.exam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marsella.exam.dto.*;
import com.marsella.exam.model.Exam;
import com.marsella.exam.model.Question;
import com.marsella.exam.model.StudentSubmission;
import com.marsella.exam.model.User;
import com.marsella.exam.repository.ExamRepository;
import com.marsella.exam.repository.StudentSubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExamService {

    private final ExamRepository examRepository;
    private final StudentSubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;
    private final ExcelExportService excelExportService;
    private final GradingService gradingService;
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();

    @Transactional(readOnly = true)
    public List<ExamResponse> getTeacherExams(Long teacherId) {
        List<Exam> exams = examRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
        return exams.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExamResponse getTeacherExam(Long teacherId, Long examId) {
        Exam exam = examRepository.findByIdAndTeacherId(examId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Examen no encontrado"));
        return mapToResponse(exam);
    }

    @Transactional
    public ExamResponse createExam(User teacher, ExamRequest request) {
        validateDates(request.getStartDate(), request.getEndDate());

        String code = request.getCode();
        if (code == null || code.trim().isEmpty()) {
            code = generateUniqueCode();
        } else {
            code = code.trim().toUpperCase();
            if (examRepository.existsByCodeIgnoreCase(code)) {
                throw new IllegalArgumentException("El código de examen '" + code + "' ya está en uso");
            }
        }

        Exam exam = Exam.builder()
                .code(code)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .grade(request.getGrade() != null ? request.getGrade().trim() : null)
                .groupName(request.getGroupName() != null ? request.getGroupName().trim() : null)
                .block(request.getBlock())
                .teacher(teacher)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        List<Question> questions = new ArrayList<>();
        double totalPoints = 0.0;

        if (request.getQuestions() != null) {
            int order = 1;
            for (QuestionDto qDto : request.getQuestions()) {
                double points = qDto.getPoints() != null ? qDto.getPoints() : 0.0;
                totalPoints += points;

                Question question = Question.builder()
                        .exam(exam)
                        .questionOrder(order++)
                        .prompt(qDto.getPrompt().trim())
                        .type(qDto.getType())
                        .points(points)
                        .questionData(qDto.getQuestionData())
                        .correctAnswer(qDto.getCorrectAnswer())
                        .build();
                questions.add(question);
            }
        }

        exam.setQuestions(questions);
        exam.setTotalPoints(Math.round(totalPoints * 100.0) / 100.0);

        Exam saved = examRepository.save(exam);
        return mapToResponse(saved);
    }

    @Transactional
    public ExamResponse cloneExam(User teacher, Long sourceExamId, CloneExamRequest request) {
        Exam source = examRepository.findByIdAndTeacherId(sourceExamId, teacher.getId())
                .orElseThrow(() -> new NoSuchElementException("Examen original no encontrado"));

        String newTitle = (request != null && request.getTitle() != null && !request.getTitle().trim().isEmpty())
                ? request.getTitle().trim()
                : source.getTitle() + " (Copia)";

        String newGrade = (request != null && request.getGrade() != null && !request.getGrade().trim().isEmpty())
                ? request.getGrade().trim()
                : source.getGrade();

        String newGroup = (request != null && request.getGroupName() != null && !request.getGroupName().trim().isEmpty())
                ? request.getGroupName().trim()
                : source.getGroupName();

        Integer newBlock = (request != null && request.getBlock() != null)
                ? request.getBlock()
                : source.getBlock();

        LocalDateTime start = (request != null && request.getStartDate() != null)
                ? request.getStartDate()
                : source.getStartDate();

        LocalDateTime end = (request != null && request.getEndDate() != null)
                ? request.getEndDate()
                : source.getEndDate();

        validateDates(start, end);

        String newCode = (request != null && request.getCode() != null && !request.getCode().trim().isEmpty())
                ? request.getCode().trim().toUpperCase()
                : generateUniqueCode();

        if (examRepository.existsByCodeIgnoreCase(newCode)) {
            throw new IllegalArgumentException("El código de examen '" + newCode + "' ya está en uso");
        }

        Boolean active = (request != null && request.getIsActive() != null)
                ? request.getIsActive()
                : true;

        Exam cloned = Exam.builder()
                .code(newCode)
                .title(newTitle)
                .description(source.getDescription())
                .grade(newGrade)
                .groupName(newGroup)
                .block(newBlock)
                .teacher(teacher)
                .startDate(start)
                .endDate(end)
                .isActive(active)
                .totalPoints(source.getTotalPoints())
                .build();

        List<Question> clonedQuestions = new ArrayList<>();
        if (source.getQuestions() != null) {
            for (Question sq : source.getQuestions()) {
                Question q = Question.builder()
                        .exam(cloned)
                        .questionOrder(sq.getQuestionOrder())
                        .prompt(sq.getPrompt())
                        .type(sq.getType())
                        .points(sq.getPoints())
                        .questionData(sq.getQuestionData())
                        .correctAnswer(sq.getCorrectAnswer())
                        .build();
                clonedQuestions.add(q);
            }
        }
        cloned.setQuestions(clonedQuestions);

        Exam saved = examRepository.save(cloned);
        log.info("Exam {} cloned to new exam ID {} with code {}", sourceExamId, saved.getId(), saved.getCode());
        return mapToResponse(saved);
    }

    @Transactional
    public ExamResponse updateExam(Long teacherId, Long examId, ExamRequest request) {
        Exam exam = examRepository.findByIdAndTeacherId(examId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Examen no encontrado"));

        validateDates(request.getStartDate(), request.getEndDate());

        if (request.getCode() != null && !request.getCode().trim().equalsIgnoreCase(exam.getCode())) {
            String newCode = request.getCode().trim().toUpperCase();
            if (examRepository.existsByCodeIgnoreCase(newCode)) {
                throw new IllegalArgumentException("El código de examen '" + newCode + "' ya está en uso");
            }
            exam.setCode(newCode);
        }

        exam.setTitle(request.getTitle().trim());
        exam.setDescription(request.getDescription());
        exam.setGrade(request.getGrade() != null ? request.getGrade().trim() : null);
        exam.setGroupName(request.getGroupName() != null ? request.getGroupName().trim() : null);
        exam.setBlock(request.getBlock());
        exam.setStartDate(request.getStartDate());
        exam.setEndDate(request.getEndDate());
        if (request.getIsActive() != null) {
            exam.setIsActive(request.getIsActive());
        }

        // Update questions preserving existing IDs where possible
        Map<Long, Question> existingById = exam.getQuestions().stream()
                .filter(q -> q.getId() != null)
                .collect(Collectors.toMap(Question::getId, q -> q));

        List<Question> updatedList = new ArrayList<>();
        double totalPoints = 0.0;

        if (request.getQuestions() != null) {
            int order = 1;
            for (QuestionDto qDto : request.getQuestions()) {
                double points = qDto.getPoints() != null ? qDto.getPoints() : 0.0;
                totalPoints += points;

                if (qDto.getId() != null && existingById.containsKey(qDto.getId())) {
                    Question existing = existingById.get(qDto.getId());
                    existing.setQuestionOrder(order++);
                    existing.setPrompt(qDto.getPrompt().trim());
                    existing.setType(qDto.getType());
                    existing.setPoints(points);
                    existing.setQuestionData(qDto.getQuestionData());
                    existing.setCorrectAnswer(qDto.getCorrectAnswer());
                    updatedList.add(existing);
                } else {
                    Question question = Question.builder()
                            .exam(exam)
                            .questionOrder(order++)
                            .prompt(qDto.getPrompt().trim())
                            .type(qDto.getType())
                            .points(points)
                            .questionData(qDto.getQuestionData())
                            .correctAnswer(qDto.getCorrectAnswer())
                            .build();
                    updatedList.add(question);
                }
            }
        }

        exam.getQuestions().clear();
        exam.getQuestions().addAll(updatedList);
        exam.setTotalPoints(Math.round(totalPoints * 100.0) / 100.0);
        Exam saved = examRepository.save(exam);

        // Automatically recalculate and sync all existing student submissions
        regradeSubmissionsForExam(saved);

        return mapToResponse(saved);
    }

    @Transactional
    public int regradeSubmissionsForExam(Exam exam) {
        List<StudentSubmission> submissions = submissionRepository.findByExamIdOrderByStartedAtDesc(exam.getId());
        int updated = 0;
        for (StudentSubmission sub : submissions) {
            if (Boolean.TRUE.equals(sub.getIsCompleted()) || (sub.getAnswersJson() != null && !sub.getAnswersJson().isBlank())) {
                GradingService.GradingOutput grading = gradingService.gradeSubmission(sub);
                sub.setScore(grading.totalScore);
                sub.setMaxScore(grading.maxScore);
                try {
                    sub.setGradingDetailsJson(objectMapper.writeValueAsString(grading.results));
                } catch (Exception e) {
                    log.error("Failed to serialize regraded results for submission {}", sub.getId(), e);
                }
                submissionRepository.save(sub);
                updated++;
            }
        }
        log.info("Recalculated grades for {} submission(s) of exam {}", updated, exam.getId());
        return updated;
    }

    @Transactional
    public int regradeExamSubmissions(Long teacherId, Long examId) {
        Exam exam = examRepository.findByIdAndTeacherId(examId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Examen no encontrado"));
        return regradeSubmissionsForExam(exam);
    }

    @Transactional
    public void deleteExam(Long teacherId, Long examId) {
        Exam exam = examRepository.findByIdAndTeacherId(examId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Examen no encontrado"));
        submissionRepository.deleteByExamId(examId);
        examRepository.delete(exam);
    }

    @Transactional(readOnly = true)
    public List<SubmissionSummaryDto> getExamSubmissions(Long teacherId, Long examId) {
        Exam exam = examRepository.findByIdAndTeacherId(examId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Examen no encontrado"));

        List<StudentSubmission> submissions = submissionRepository.findByExamIdOrderByStartedAtDesc(exam.getId());

        return submissions.stream().map(sub -> {
            double scoreVal = sub.getScore() != null ? sub.getScore() : 0.0;
            double maxScoreVal = sub.getMaxScore() != null ? sub.getMaxScore() : 0.0;
            double pct = (maxScoreVal > 0)
                    ? Math.round((scoreVal / maxScoreVal) * 100.0 * 10.0) / 10.0
                    : 0.0;

            return SubmissionSummaryDto.builder()
                    .id(sub.getId())
                    .studentName(sub.getStudentName())
                    .startedAt(sub.getStartedAt())
                    .submittedAt(sub.getSubmittedAt())
                    .isCompleted(sub.getIsCompleted())
                    .score(scoreVal)
                    .maxScore(maxScoreVal)
                    .percentage(pct)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SubmissionDetailDto getSubmissionDetail(Long teacherId, Long examId, Long submissionId) {
        Exam exam = examRepository.findByIdAndTeacherId(examId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Examen no encontrado"));

        StudentSubmission sub = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new NoSuchElementException("Entrega no encontrada"));

        if (!sub.getExam().getId().equals(exam.getId())) {
            throw new IllegalArgumentException("La entrega no corresponde a este examen");
        }

        List<QuestionResultDto> results = new ArrayList<>();
        if (sub.getGradingDetailsJson() != null && !sub.getGradingDetailsJson().isBlank()) {
            try {
                results = objectMapper.readValue(sub.getGradingDetailsJson(), new TypeReference<List<QuestionResultDto>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse grading details JSON", e);
            }
        }

        double scoreVal = sub.getScore() != null ? sub.getScore() : 0.0;
        double maxScoreVal = sub.getMaxScore() != null ? sub.getMaxScore() : 0.0;
        double pct = (maxScoreVal > 0)
                ? Math.round((scoreVal / maxScoreVal) * 100.0 * 10.0) / 10.0
                : 0.0;

        return SubmissionDetailDto.builder()
                .id(sub.getId())
                .examId(exam.getId())
                .examTitle(exam.getTitle())
                .studentName(sub.getStudentName())
                .startedAt(sub.getStartedAt())
                .submittedAt(sub.getSubmittedAt())
                .isCompleted(sub.getIsCompleted())
                .score(scoreVal)
                .maxScore(maxScoreVal)
                .percentage(pct)
                .questionResults(results)
                .build();
    }

    @Transactional(readOnly = true)
    public byte[] exportSubmissionsToExcel(Long teacherId, Long examId) {
        Exam exam = examRepository.findByIdAndTeacherId(examId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Examen no encontrado o no tiene permisos para acceder a él"));

        List<StudentSubmission> submissions = submissionRepository.findByExamIdOrderByStudentNameAsc(exam.getId());

        try {
            return excelExportService.generateSubmissionsExcel(exam, submissions);
        } catch (Exception e) {
            log.error("Error al generar el archivo Excel de calificaciones para examen {}", examId, e);
            throw new RuntimeException("Error al generar el reporte en Excel: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public String getExamExportFilename(Long teacherId, Long examId) {
        Exam exam = examRepository.findByIdAndTeacherId(examId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Examen no encontrado"));
        String cleanCode = exam.getCode() != null ? exam.getCode().replaceAll("[^a-zA-Z0-9_-]", "_") : "EXAM";
        String cleanGrade = exam.getGrade() != null ? exam.getGrade().replaceAll("[^a-zA-Z0-9_-]", "") : "";
        String cleanGroup = exam.getGroupName() != null ? exam.getGroupName().replaceAll("[^a-zA-Z0-9_-]", "") : "";
        String suffix = (!cleanGrade.isEmpty() || !cleanGroup.isEmpty()) ? "_" + cleanGrade + cleanGroup : "";
        return "Calificaciones_" + cleanCode + suffix + ".xlsx";
    }

    private void validateDates(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("Las fechas de inicio y fin son obligatorias");
        }
        if (end.isBefore(start) || end.isEqual(start)) {
            throw new IllegalArgumentException("La fecha de fin debe ser posterior a la fecha de inicio");
        }
    }

    private String generateUniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder("EXAM-");
            for (int i = 0; i < 4; i++) {
                sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
        } while (examRepository.existsByCodeIgnoreCase(code));
        return code;
    }

    private ExamResponse mapToResponse(Exam exam) {
        long totalSubs = submissionRepository.countByExamId(exam.getId());
        long completedSubs = submissionRepository.countByExamIdAndIsCompletedTrue(exam.getId());

        List<QuestionDto> qDtos = exam.getQuestions().stream().map(q -> QuestionDto.builder()
                .id(q.getId())
                .questionOrder(q.getQuestionOrder())
                .prompt(q.getPrompt())
                .type(q.getType())
                .points(q.getPoints())
                .questionData(q.getQuestionData())
                .correctAnswer(q.getCorrectAnswer())
                .build()
        ).collect(Collectors.toList());

        return ExamResponse.builder()
                .id(exam.getId())
                .code(exam.getCode())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .grade(exam.getGrade())
                .groupName(exam.getGroupName())
                .block(exam.getBlock())
                .startDate(exam.getStartDate())
                .endDate(exam.getEndDate())
                .totalPoints(exam.getTotalPoints())
                .isActive(exam.getIsActive())
                .isEditable(exam.isEditable())
                .isOngoing(exam.isOngoing())
                .submissionCount(totalSubs)
                .completedCount(completedSubs)
                .questions(qDtos)
                .createdAt(exam.getCreatedAt())
                .build();
    }
}
