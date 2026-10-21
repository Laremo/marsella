package com.marsella.exam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marsella.exam.dto.QuestionResultDto;
import com.marsella.exam.model.Question;
import com.marsella.exam.model.StudentSubmission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GradingService {

    private final ObjectMapper objectMapper;

    public static class GradingOutput {
        public double totalScore;
        public double maxScore;
        public List<QuestionResultDto> results = new ArrayList<>();
    }

    public GradingOutput gradeSubmission(StudentSubmission submission) {
        GradingOutput output = new GradingOutput();
        List<Question> questions = submission.getExam().getQuestions();

        Map<String, Object> studentAnswersMap = new HashMap<>();
        if (submission.getAnswersJson() != null && !submission.getAnswersJson().isBlank()) {
            try {
                studentAnswersMap = objectMapper.readValue(submission.getAnswersJson(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse student answers JSON: {}", submission.getAnswersJson(), e);
            }
        }

        double totalScore = 0.0;
        double maxScore = 0.0;

        for (Question question : questions) {
            double qPoints = question.getPoints() != null ? question.getPoints() : 0.0;
            maxScore += qPoints;

            Object rawStudentAnswer = studentAnswersMap.get(String.valueOf(question.getId()));
            QuestionResultDto result = evaluateQuestion(question, rawStudentAnswer);
            totalScore += result.getAwardedPoints();
            output.results.add(result);
        }

        output.totalScore = Math.round(totalScore * 100.0) / 100.0;
        output.maxScore = Math.round(maxScore * 100.0) / 100.0;
        return output;
    }

    private QuestionResultDto evaluateQuestion(Question question, Object studentAnswer) {
        double maxPoints = question.getPoints() != null ? question.getPoints() : 0.0;
        double awardedPoints = 0.0;
        boolean isCorrect = false;
        Object parsedCorrectAnswer = null;

        try {
            parsedCorrectAnswer = objectMapper.readValue(question.getCorrectAnswer(), Object.class);
        } catch (Exception e) {
            parsedCorrectAnswer = question.getCorrectAnswer();
        }

        if (studentAnswer == null) {
            return QuestionResultDto.builder()
                    .questionId(question.getId())
                    .questionOrder(question.getQuestionOrder())
                    .prompt(question.getPrompt())
                    .type(question.getType())
                    .maxPoints(maxPoints)
                    .awardedPoints(0.0)
                    .isCorrect(false)
                    .studentAnswer(null)
                    .correctAnswer(parsedCorrectAnswer)
                    .questionData(question.getQuestionData())
                    .build();
        }

        try {
            switch (question.getType()) {
                case MULTIPLE_CHOICE:
                case CODE_BLOCK: {
                    List<String> studentChoices = extractListOrSingleString(studentAnswer);
                    List<String> correctChoices = extractListOrSingleString(parsedCorrectAnswer);

                    Set<String> sSet = new HashSet<>(studentChoices);
                    Set<String> cSet = new HashSet<>(correctChoices);

                    if (!sSet.isEmpty() && sSet.equals(cSet)) {
                        awardedPoints = maxPoints;
                        isCorrect = true;
                    }
                    break;
                }
                case TRUE_FALSE: {
                    String sVal = String.valueOf(studentAnswer).trim().toLowerCase();
                    String cVal = String.valueOf(parsedCorrectAnswer).trim().toLowerCase();

                    if (sVal.equals(cVal)) {
                        awardedPoints = maxPoints;
                        isCorrect = true;
                    }
                    break;
                }
                case RELATE_COLUMNS: {
                    Map<String, String> studentMatches = convertToStringMap(studentAnswer);
                    Map<String, String> correctMatches = convertToStringMap(parsedCorrectAnswer);

                    if (!correctMatches.isEmpty()) {
                        int matchCount = 0;
                        for (Map.Entry<String, String> entry : correctMatches.entrySet()) {
                            String studentVal = studentMatches.get(entry.getKey());
                            if (studentVal != null && studentVal.trim().equalsIgnoreCase(entry.getValue().trim())) {
                                matchCount++;
                            }
                        }
                        double fraction = (double) matchCount / correctMatches.size();
                        awardedPoints = Math.round((fraction * maxPoints) * 100.0) / 100.0;
                        isCorrect = (matchCount == correctMatches.size());
                    }
                    break;
                }
                case FILL_BLANKS: {
                    List<String> studentBlanks = extractListOrSingleString(studentAnswer);
                    List<String> correctBlanks = extractListOrSingleString(parsedCorrectAnswer);

                    if (!correctBlanks.isEmpty()) {
                        int correctCount = 0;
                        for (int i = 0; i < correctBlanks.size(); i++) {
                            if (i < studentBlanks.size()) {
                                String s = studentBlanks.get(i) != null ? studentBlanks.get(i).trim().toLowerCase() : "";
                                String c = correctBlanks.get(i) != null ? correctBlanks.get(i).trim().toLowerCase() : "";
                                if (s.equals(c)) {
                                    correctCount++;
                                }
                            }
                        }
                        double fraction = (double) correctCount / correctBlanks.size();
                        awardedPoints = Math.round((fraction * maxPoints) * 100.0) / 100.0;
                        isCorrect = (correctCount == correctBlanks.size());
                    }
                    break;
                }
                case OPEN_TEXT: {
                    String sAns = studentAnswer != null ? String.valueOf(studentAnswer).trim() : "";
                    String cAns = parsedCorrectAnswer != null ? String.valueOf(parsedCorrectAnswer).trim() : "";
                    if (!sAns.isEmpty()) {
                        if (cAns.isEmpty()) {
                            awardedPoints = maxPoints;
                            isCorrect = true;
                        } else if (sAns.equalsIgnoreCase(cAns) || sAns.toLowerCase().contains(cAns.toLowerCase())) {
                            awardedPoints = maxPoints;
                            isCorrect = true;
                        } else {
                            awardedPoints = 0.0;
                            isCorrect = false;
                        }
                    } else {
                        awardedPoints = 0.0;
                        isCorrect = false;
                    }
                    break;
                }
            }
        } catch (Exception e) {
            log.error("Error evaluating question {}: {}", question.getId(), e.getMessage());
            awardedPoints = 0.0;
            isCorrect = false;
        }

        return QuestionResultDto.builder()
                .questionId(question.getId())
                .questionOrder(question.getQuestionOrder())
                .prompt(question.getPrompt())
                .type(question.getType())
                .maxPoints(maxPoints)
                .awardedPoints(awardedPoints)
                .isCorrect(isCorrect)
                .studentAnswer(studentAnswer)
                .correctAnswer(parsedCorrectAnswer)
                .questionData(question.getQuestionData())
                .build();
    }

    @SuppressWarnings("unchecked")
    private List<String> extractListOrSingleString(Object obj) {
        List<String> list = new ArrayList<>();
        if (obj == null) return list;

        if (obj instanceof List<?>) {
            for (Object item : (List<?>) obj) {
                if (item != null) list.add(String.valueOf(item).trim());
            }
        } else if (obj instanceof Map<?, ?>) {
            Map<?, ?> map = (Map<?, ?>) obj;
            // Map index -> string or value
            for (Object val : map.values()) {
                if (val != null) list.add(String.valueOf(val).trim());
            }
        } else {
            list.add(String.valueOf(obj).trim());
        }
        return list;
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> convertToStringMap(Object obj) {
        Map<String, String> result = new HashMap<>();
        if (obj instanceof Map<?, ?>) {
            Map<?, ?> map = (Map<?, ?>) obj;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                if (entry.getKey() != null && entry.getValue() != null) {
                    result.put(String.valueOf(entry.getKey()).trim(), String.valueOf(entry.getValue()).trim());
                }
            }
        }
        return result;
    }
}
