package com.marsella.exam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marsella.exam.dto.CreateQuizRequest;
import com.marsella.exam.dto.QuizDto;
import com.marsella.exam.dto.QuizOptionDto;
import com.marsella.exam.dto.QuizQuestionDto;
import com.marsella.exam.exception.ResourceNotFoundException;
import com.marsella.exam.model.Quiz;
import com.marsella.exam.model.QuizQuestion;
import com.marsella.exam.model.SchoolGroup;
import com.marsella.exam.model.User;
import com.marsella.exam.repository.QuizQuestionRepository;
import com.marsella.exam.repository.QuizRepository;
import com.marsella.exam.repository.SchoolGroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final SchoolGroupRepository schoolGroupRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<QuizDto> getQuizzesForTeacher(User teacher) {
        return quizRepository.findByTeacherOrderByCreatedAtDesc(teacher)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuizDto getQuizDtoById(Long id, User teacher) {
        Quiz quiz = getQuizEntityById(id, teacher);
        return mapToDto(quiz);
    }

    @Transactional(readOnly = true)
    public Quiz getQuizEntityById(Long id, User teacher) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz no encontrado con ID: " + id));
        if (!quiz.getTeacher().getId().equals(teacher.getId())) {
            throw new IllegalArgumentException("No tienes permiso para acceder a este quiz.");
        }
        return quiz;
    }

    @Transactional
    public QuizDto createQuiz(CreateQuizRequest request, User teacher) {
        SchoolGroup group = null;
        if (request.getSchoolGroupId() != null) {
            group = schoolGroupRepository.findById(request.getSchoolGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Grupo escolar no encontrado con ID: " + request.getSchoolGroupId()));
        }

        Quiz quiz = Quiz.builder()
                .teacher(teacher)
                .schoolGroup(group)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .defaultTimeLimitSeconds(request.getDefaultTimeLimitSeconds() != null ? request.getDefaultTimeLimitSeconds() : 15)
                .basePoints(request.getBasePoints() != null ? request.getBasePoints() : 1000)
                .createdAt(LocalDateTime.now())
                .build();

        List<QuizQuestion> questions = new ArrayList<>();
        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            int order = 1;
            for (QuizQuestionDto qDto : request.getQuestions()) {
                questions.add(buildQuestionEntity(quiz, qDto, order++));
            }
        }

        quiz.setQuestions(questions);
        Quiz saved = quizRepository.save(quiz);
        log.info("Created new Quiz '{}' with {} questions by teacher '{}'", saved.getTitle(), saved.getQuestions().size(), teacher.getUsername());
        return mapToDto(saved);
    }

    @Transactional
    public QuizDto updateQuiz(Long id, CreateQuizRequest request, User teacher) {
        Quiz quiz = getQuizEntityById(id, teacher);

        SchoolGroup group = null;
        if (request.getSchoolGroupId() != null) {
            group = schoolGroupRepository.findById(request.getSchoolGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Grupo escolar no encontrado con ID: " + request.getSchoolGroupId()));
        }

        quiz.setTitle(request.getTitle().trim());
        quiz.setDescription(request.getDescription());
        quiz.setSchoolGroup(group);
        if (request.getDefaultTimeLimitSeconds() != null) {
            quiz.setDefaultTimeLimitSeconds(request.getDefaultTimeLimitSeconds());
        }
        if (request.getBasePoints() != null) {
            quiz.setBasePoints(request.getBasePoints());
        }

        quiz.getQuestions().clear();
        if (request.getQuestions() != null && !request.getQuestions().isEmpty()) {
            int order = 1;
            for (QuizQuestionDto qDto : request.getQuestions()) {
                quiz.getQuestions().add(buildQuestionEntity(quiz, qDto, order++));
            }
        }

        Quiz updated = quizRepository.save(quiz);
        log.info("Updated Quiz '{}' with {} questions", updated.getTitle(), updated.getQuestions().size());
        return mapToDto(updated);
    }

    @Transactional
    public void deleteQuiz(Long id, User teacher) {
        Quiz quiz = getQuizEntityById(id, teacher);
        quizRepository.delete(quiz);
        log.info("Deleted Quiz ID '{}'", id);
    }

    private QuizQuestion buildQuestionEntity(Quiz quiz, QuizQuestionDto dto, int order) {
        List<QuizOptionDto> options = dto.getOptions();
        if (options == null || options.isEmpty()) {
            options = Arrays.asList(
                    new QuizOptionDto("A", "Opción A", "RED", "TRIANGLE", true),
                    new QuizOptionDto("B", "Opción B", "BLUE", "DIAMOND", false),
                    new QuizOptionDto("C", "Opción C", "YELLOW", "CIRCLE", false),
                    new QuizOptionDto("D", "Opción D", "GREEN", "SQUARE", false)
            );
        } else {
            // Guarantee standard shapes & colors if missing
            String[] defaultColors = {"RED", "BLUE", "YELLOW", "GREEN"};
            String[] defaultShapes = {"TRIANGLE", "DIAMOND", "CIRCLE", "SQUARE"};
            for (int i = 0; i < options.size(); i++) {
                QuizOptionDto opt = options.get(i);
                if (opt.getId() == null || opt.getId().isEmpty()) {
                    opt.setId(String.valueOf((char) ('A' + i)));
                }
                if (opt.getColor() == null || opt.getColor().isEmpty()) {
                    opt.setColor(defaultColors[i % defaultColors.length]);
                }
                if (opt.getShape() == null || opt.getShape().isEmpty()) {
                    opt.setShape(defaultShapes[i % defaultShapes.length]);
                }
            }
        }

        String json;
        try {
            json = objectMapper.writeValueAsString(options);
        } catch (Exception e) {
            json = "[]";
        }

        return QuizQuestion.builder()
                .quiz(quiz)
                .questionOrder(order)
                .prompt(dto.getPrompt() != null ? dto.getPrompt().trim() : "Pregunta " + order)
                .imageUrl(dto.getImageUrl())
                .timeLimitSeconds(dto.getTimeLimitSeconds() != null ? dto.getTimeLimitSeconds() : quiz.getDefaultTimeLimitSeconds())
                .points(dto.getPoints() != null ? dto.getPoints() : quiz.getBasePoints())
                .optionsJson(json)
                .explanation(dto.getExplanation())
                .build();
    }

    public QuizDto mapToDto(Quiz quiz) {
        List<QuizQuestionDto> questionDtos = quiz.getQuestions().stream()
                .map(this::mapQuestionToDto)
                .collect(Collectors.toList());

        return QuizDto.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .schoolGroupId(quiz.getSchoolGroup() != null ? quiz.getSchoolGroup().getId() : null)
                .schoolGroupName(quiz.getSchoolGroup() != null ? quiz.getSchoolGroup().getGrade() + " \"" + quiz.getSchoolGroup().getName() + "\"" : null)
                .defaultTimeLimitSeconds(quiz.getDefaultTimeLimitSeconds())
                .basePoints(quiz.getBasePoints())
                .questionCount(quiz.getQuestions() != null ? quiz.getQuestions().size() : 0)
                .createdAt(quiz.getCreatedAt())
                .questions(questionDtos)
                .build();
    }

    public QuizQuestionDto mapQuestionToDto(QuizQuestion question) {
        List<QuizOptionDto> options = parseOptions(question.getOptionsJson());
        return QuizQuestionDto.builder()
                .id(question.getId())
                .questionOrder(question.getQuestionOrder())
                .prompt(question.getPrompt())
                .imageUrl(question.getImageUrl())
                .timeLimitSeconds(question.getTimeLimitSeconds())
                .points(question.getPoints())
                .options(options)
                .explanation(question.getExplanation())
                .build();
    }

    public List<QuizOptionDto> parseOptions(String json) {
        if (json == null || json.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<QuizOptionDto>>() {});
        } catch (Exception e) {
            log.error("Failed to parse optionsJson: {}", json, e);
            return new ArrayList<>();
        }
    }
}

