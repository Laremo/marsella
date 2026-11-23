package com.marsella.exam.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marsella.exam.dto.*;
import com.marsella.exam.exception.ResourceNotFoundException;
import com.marsella.exam.model.*;
import com.marsella.exam.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LiveQuizService {

    private final LiveQuizSessionRepository sessionRepository;
    private final QuizRepository quizRepository;
    private final QuizPlayerRepository playerRepository;
    private final QuizPlayerAnswerRepository answerRepository;
    private final SchoolGroupRepository schoolGroupRepository;
    private final StudentRepository studentRepository;
    private final QuizService quizService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String[] AVATARS = {"🦊", "🚀", "🐼", "⚡", "🦁", "🐯", "🦖", "🦄", "🎯", "🌟", "👾", "🔥", "🐬", "🏆", "🍕"};

    @Transactional
    public LiveQuizStateDto createSession(Long quizId, Long schoolGroupId, User teacher) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz no encontrado con ID: " + quizId));
        if (!quiz.getTeacher().getId().equals(teacher.getId())) {
            throw new IllegalArgumentException("No tienes permiso para iniciar una partida de este quiz.");
        }

        SchoolGroup group = null;
        if (schoolGroupId != null) {
            group = schoolGroupRepository.findById(schoolGroupId)
                    .orElseThrow(() -> new ResourceNotFoundException("Grupo escolar no encontrado con ID: " + schoolGroupId));
        } else if (quiz.getSchoolGroup() != null) {
            group = quiz.getSchoolGroup();
        }

        String pin = generateUniquePin();

        LiveQuizSession session = LiveQuizSession.builder()
                .pin(pin)
                .quiz(quiz)
                .teacher(teacher)
                .schoolGroup(group)
                .status(QuizSessionStatus.LOBBY)
                .currentQuestionIndex(0)
                .currentQuestionTimeLimit(quiz.getDefaultTimeLimitSeconds())
                .createdAt(LocalDateTime.now())
                .build();

        LiveQuizSession saved = sessionRepository.save(session);
        log.info("Created Live Quiz Session PIN '{}' for quiz '{}' by '{}'", pin, quiz.getTitle(), teacher.getUsername());

        return getLiveState(saved.getPin(), null);
    }

    @Transactional
    public QuizPlayerStateDto joinQuiz(JoinQuizRequest request) {
        LiveQuizSession session = sessionRepository.findByPin(request.getPin().trim())
                .orElseThrow(() -> new ResourceNotFoundException("No se encontró ninguna sesión activa con el PIN: " + request.getPin()));

        if (session.getStatus() == QuizSessionStatus.FINISHED) {
            throw new IllegalStateException("Esta partida ya ha finalizado.");
        }

        // Check if player is reconnecting with an existing token
        if (request.getPlayerToken() != null && !request.getPlayerToken().trim().isEmpty()) {
            Optional<QuizPlayer> existingPlayer = playerRepository.findBySessionAndSessionToken(session, request.getPlayerToken().trim());
            if (existingPlayer.isPresent()) {
                QuizPlayer player = existingPlayer.get();
                player.setIsConnected(true);
                player.setLastActiveTime(System.currentTimeMillis());
                if (request.getNickname() != null && !request.getNickname().trim().isEmpty()) {
                    player.setNickname(request.getNickname().trim());
                }
                playerRepository.save(player);
                notifySessionUpdate(session.getPin());
                return mapPlayerToStateDto(player, session);
            }
        }

        Student student = null;
        String chosenNickname = request.getNickname().trim();

        if (request.getStudentId() != null) {
            student = studentRepository.findById(request.getStudentId()).orElse(null);
            if (student != null) {
                // If nickname wasn't explicitly changed, use the student's name
                if (chosenNickname.isEmpty() || chosenNickname.equalsIgnoreCase("Alumno")) {
                    chosenNickname = student.getFullName();
                }
            }
        }

        // Avoid duplicate active nicknames in the same session
        Optional<QuizPlayer> duplicate = playerRepository.findBySessionAndNicknameIgnoreCase(session, chosenNickname);
        if (duplicate.isPresent()) {
            QuizPlayer dup = duplicate.get();
            // If the duplicate player has been inactive for more than 40 seconds, allow resuming
            if (!dup.getIsConnected() || (System.currentTimeMillis() - dup.getLastActiveTime() > 40000)) {
                dup.setIsConnected(true);
                dup.setLastActiveTime(System.currentTimeMillis());
                playerRepository.save(dup);
                notifySessionUpdate(session.getPin());
                return mapPlayerToStateDto(dup, session);
            } else {
                chosenNickname = chosenNickname + " (" + (session.getPlayers().size() + 1) + ")";
            }
        }

        String avatar = request.getAvatar();
        if (avatar == null || avatar.trim().isEmpty()) {
            avatar = AVATARS[RANDOM.nextInt(AVATARS.length)];
        }

        String sessionToken = UUID.randomUUID().toString();

        QuizPlayer newPlayer = QuizPlayer.builder()
                .session(session)
                .sessionToken(sessionToken)
                .nickname(chosenNickname)
                .student(student)
                .avatar(avatar)
                .totalScore(0)
                .currentStreak(0)
                .highestStreak(0)
                .correctAnswersCount(0)
                .totalAnswersCount(0)
                .isConnected(true)
                .lastActiveTime(System.currentTimeMillis())
                .joinedAt(LocalDateTime.now())
                .build();

        QuizPlayer savedPlayer = playerRepository.save(newPlayer);
        session.getPlayers().add(savedPlayer);

        log.info("Player '{}' ({}) joined session PIN '{}'", chosenNickname, avatar, session.getPin());

        notifySessionUpdate(session.getPin());

        return mapPlayerToStateDto(savedPlayer, session);
    }

    @Transactional
    public void heartbeat(String pin, String playerToken) {
        LiveQuizSession session = sessionRepository.findByPin(pin).orElse(null);
        if (session != null && playerToken != null) {
            playerRepository.findBySessionAndSessionToken(session, playerToken).ifPresent(p -> {
                p.setIsConnected(true);
                p.setLastActiveTime(System.currentTimeMillis());
                playerRepository.save(p);
            });
        }
    }

    @Transactional
    public LiveQuizStateDto advancePhase(String pin, User teacher) {
        LiveQuizSession session = sessionRepository.findByPin(pin)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada con PIN: " + pin));

        if (!session.getTeacher().getId().equals(teacher.getId())) {
            throw new IllegalArgumentException("No tienes permiso para controlar esta sesión.");
        }

        Quiz quiz = session.getQuiz();
        List<QuizQuestion> questions = quiz.getQuestions();
        int totalQuestions = questions.size();
        int currentIdx = session.getCurrentQuestionIndex();

        switch (session.getStatus()) {
            case LOBBY:
                if (totalQuestions == 0) {
                    throw new IllegalStateException("El quiz no tiene preguntas configuradas.");
                }
                session.setStatus(QuizSessionStatus.PREVIEW);
                session.setCurrentQuestionIndex(0);
                QuizQuestion firstQ = questions.get(0);
                session.setCurrentQuestionTimeLimit(firstQ.getTimeLimitSeconds());
                session.setCurrentQuestionStartTime(System.currentTimeMillis());
                break;

            case PREVIEW:
                session.setStatus(QuizSessionStatus.QUESTION_ACTIVE);
                session.setCurrentQuestionStartTime(System.currentTimeMillis());
                break;

            case QUESTION_ACTIVE:
                session.setStatus(QuizSessionStatus.QUESTION_CLOSED);
                break;

            case QUESTION_CLOSED:
                session.setStatus(QuizSessionStatus.LEADERBOARD);
                break;

            case LEADERBOARD:
                if (currentIdx + 1 < totalQuestions) {
                    session.setCurrentQuestionIndex(currentIdx + 1);
                    QuizQuestion nextQ = questions.get(currentIdx + 1);
                    session.setCurrentQuestionTimeLimit(nextQ.getTimeLimitSeconds());
                    session.setCurrentQuestionStartTime(System.currentTimeMillis());
                    session.setStatus(QuizSessionStatus.PREVIEW);
                } else {
                    session.setStatus(QuizSessionStatus.PODIUM);
                    session.setEndedAt(LocalDateTime.now());
                }
                break;

            case PODIUM:
                session.setStatus(QuizSessionStatus.FINISHED);
                break;

            case FINISHED:
                break;
        }

        LiveQuizSession updated = sessionRepository.save(session);
        log.info("Session PIN '{}' transitioned to phase '{}' (Q: {}/{})", pin, updated.getStatus(), updated.getCurrentQuestionIndex() + 1, totalQuestions);

        notifySessionUpdate(pin);

        return getLiveState(pin, null);
    }

    @Transactional
    public QuizPlayerStateDto submitAnswer(String pin, SubmitQuizAnswerRequest request) {
        LiveQuizSession session = sessionRepository.findByPin(pin)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada con PIN: " + pin));

        if (session.getStatus() != QuizSessionStatus.QUESTION_ACTIVE) {
            throw new IllegalStateException("El tiempo para responder esta pregunta ha concluido o no está activa.");
        }

        QuizPlayer player = playerRepository.findBySessionAndSessionToken(session, request.getPlayerToken())
                .orElseThrow(() -> new ResourceNotFoundException("Jugador no válido para esta sesión."));

        int currentIdx = session.getCurrentQuestionIndex();
        List<QuizQuestion> questions = session.getQuiz().getQuestions();
        if (currentIdx < 0 || currentIdx >= questions.size()) {
            throw new IllegalStateException("Índice de pregunta inválido.");
        }

        // Return if already answered (immutable)
        Optional<QuizPlayerAnswer> existingAnswer = answerRepository.findByPlayerAndQuestionIndex(player, currentIdx);
        if (existingAnswer.isPresent()) {
            return mapPlayerToStateDto(player, session);
        }

        QuizQuestion question = questions.get(currentIdx);
        List<QuizOptionDto> options = quizService.parseOptions(question.getOptionsJson());

        if (request.getSelectedOptionId() == null || request.getSelectedOptionId().trim().isEmpty()) {
            throw new IllegalArgumentException("Debes seleccionar una opción de respuesta.");
        }
        String chosenOptionId = request.getSelectedOptionId().trim();
        QuizOptionDto selectedOption = options.stream()
                .filter(o -> o.getId().equalsIgnoreCase(chosenOptionId))
                .findFirst()
                .orElse(null);

        boolean isCorrect = selectedOption != null && Boolean.TRUE.equals(selectedOption.getIsCorrect());

        long now = System.currentTimeMillis();
        long startTime = session.getCurrentQuestionStartTime() != null ? session.getCurrentQuestionStartTime() : now;
        long responseTimeMs = Math.max(50, now - startTime);

        int timeLimitSeconds = session.getCurrentQuestionTimeLimit();
        long timeLimitMs = timeLimitSeconds * 1000L;

        int pointsAwarded = 0;
        int streakBonus = 0;

        if (isCorrect) {
            double timeRatio = Math.min(1.0, Math.max(0.0, (double) responseTimeMs / (double) timeLimitMs));
            // Speed Formula: round((1 - (responseTimeMs / (2 * timeLimitMs))) * basePoints)
            int basePoints = question.getPoints() != null ? question.getPoints() : 1000;
            int speedScore = (int) Math.round((1.0 - (timeRatio / 2.0)) * basePoints);

            int newStreak = player.getCurrentStreak() + 1;
            if (newStreak == 2) streakBonus = 100;
            else if (newStreak == 3) streakBonus = 200;
            else if (newStreak == 4) streakBonus = 300;
            else if (newStreak >= 5) streakBonus = 500;

            pointsAwarded = speedScore + streakBonus;

            player.setTotalScore(player.getTotalScore() + pointsAwarded);
            player.setCurrentStreak(newStreak);
            if (newStreak > player.getHighestStreak()) {
                player.setHighestStreak(newStreak);
            }
            player.setCorrectAnswersCount(player.getCorrectAnswersCount() + 1);
        } else {
            player.setCurrentStreak(0);
        }

        player.setTotalAnswersCount(player.getTotalAnswersCount() + 1);
        player.setLastActiveTime(now);
        playerRepository.save(player);

        QuizPlayerAnswer answer = QuizPlayerAnswer.builder()
                .player(player)
                .session(session)
                .questionIndex(currentIdx)
                .selectedOptionId(chosenOptionId)
                .isCorrect(isCorrect)
                .responseTimeMs(responseTimeMs)
                .pointsAwarded(pointsAwarded)
                .streakBonus(streakBonus)
                .streakCount(player.getCurrentStreak())
                .submittedAt(now)
                .build();

        answerRepository.save(answer);

        log.info("Player '{}' answered Q{}: {} ({} ms, +{} pts, streak: {})",
                player.getNickname(), currentIdx + 1, isCorrect ? "CORRECT" : "WRONG", responseTimeMs, pointsAwarded, player.getCurrentStreak());

        // Check if 100% of connected players have answered -> Auto-close question!
        long connectedPlayersCount = playerRepository.findBySessionOrderByTotalScoreDesc(session)
                .stream()
                .filter(QuizPlayer::getIsConnected)
                .count();

        long answersCount = answerRepository.countBySessionAndQuestionIndex(session, currentIdx);

        if (connectedPlayersCount > 0 && answersCount >= connectedPlayersCount) {
            log.info("All {} connected players have answered Q{}. Auto-closing question!", connectedPlayersCount, currentIdx + 1);
            session.setStatus(QuizSessionStatus.QUESTION_CLOSED);
            sessionRepository.save(session);
        }

        notifySessionUpdate(session.getPin());

        return mapPlayerToStateDto(player, session);
    }

    @Transactional(readOnly = true)
    public LiveQuizStateDto getLiveState(String pin, String playerToken) {
        LiveQuizSession session = sessionRepository.findByPin(pin)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada con PIN: " + pin));

        Quiz quiz = session.getQuiz();
        List<QuizQuestion> questions = quiz.getQuestions();
        int totalQuestions = questions.size();
        int currentIdx = Math.min(session.getCurrentQuestionIndex(), Math.max(0, totalQuestions - 1));

        QuizQuestion currentQEntity = totalQuestions > 0 ? questions.get(currentIdx) : null;
        QuizQuestionDto filteredQuestion = null;

        if (currentQEntity != null) {
            filteredQuestion = filterQuestionForPhase(currentQEntity, session.getStatus());
        }

        List<QuizPlayer> allPlayers = playerRepository.findBySessionOrderByTotalScoreDesc(session);

        // Calculate ranks
        List<QuizPlayerSummaryDto> playerSummaries = new ArrayList<>();
        Map<Long, QuizPlayerAnswer> currentQAnswers = answerRepository.findBySessionAndQuestionIndex(session, currentIdx)
                .stream()
                .collect(Collectors.toMap(a -> a.getPlayer().getId(), a -> a, (k1, k2) -> k1));

        int rank = 1;
        for (QuizPlayer p : allPlayers) {
            QuizPlayerAnswer ans = currentQAnswers.get(p.getId());
            playerSummaries.add(QuizPlayerSummaryDto.builder()
                    .id(p.getId())
                    .nickname(p.getNickname())
                    .studentId(p.getStudent() != null ? p.getStudent().getId() : null)
                    .studentName(p.getStudent() != null ? p.getStudent().getFullName() : null)
                    .avatar(p.getAvatar())
                    .totalScore(p.getTotalScore())
                    .currentStreak(p.getCurrentStreak())
                    .rank(rank++)
                    .isConnected(p.getIsConnected())
                    .hasAnsweredCurrentQuestion(ans != null)
                    .lastPointsAwarded(ans != null ? ans.getPointsAwarded() : null)
                    .lastStreakBonus(ans != null ? ans.getStreakBonus() : null)
                    .lastAnswerCorrect(ans != null ? ans.getIsCorrect() : null)
                    .lastResponseTimeMs(ans != null ? ans.getResponseTimeMs() : null)
                    .build());
        }

        // Top 5 for leaderboard
        List<QuizPlayerSummaryDto> topPlayers = playerSummaries.stream()
                .limit(5)
                .collect(Collectors.toList());

        // Option stats when closed or later
        Map<String, Integer> optionStats = new HashMap<>();
        if (session.getStatus() == QuizSessionStatus.QUESTION_CLOSED ||
            session.getStatus() == QuizSessionStatus.LEADERBOARD ||
            session.getStatus() == QuizSessionStatus.PODIUM ||
            session.getStatus() == QuizSessionStatus.FINISHED) {
            for (QuizPlayerAnswer a : currentQAnswers.values()) {
                if (a.getSelectedOptionId() != null) {
                    optionStats.put(a.getSelectedOptionId(), optionStats.getOrDefault(a.getSelectedOptionId(), 0) + 1);
                }
            }
            if (filteredQuestion != null && filteredQuestion.getOptions() != null) {
                for (QuizOptionDto opt : filteredQuestion.getOptions()) {
                    opt.setResponseCount(optionStats.getOrDefault(opt.getId(), 0));
                }
            }
        }

        // Group Roster with connected indicator
        List<StudentRosterDto> rosterDtos = new ArrayList<>();
        if (session.getSchoolGroup() != null) {
            List<Student> groupStudents = studentRepository.findBySchoolGroupIdOrderByListNumberAsc(session.getSchoolGroup().getId());
            Map<Long, QuizPlayer> joinedStudents = allPlayers.stream()
                    .filter(p -> p.getStudent() != null)
                    .collect(Collectors.toMap(p -> p.getStudent().getId(), p -> p, (k1, k2) -> k1));

            for (Student s : groupStudents) {
                QuizPlayer matched = joinedStudents.get(s.getId());
                rosterDtos.add(StudentRosterDto.builder()
                        .studentId(s.getId())
                        .fullName(s.getFullName())
                        .listNumber(s.getListNumber())
                        .hasJoined(matched != null)
                        .nickname(matched != null ? matched.getNickname() : null)
                        .avatar(matched != null ? matched.getAvatar() : null)
                        .build());
            }
        }

        long now = System.currentTimeMillis();
        long startTime = session.getCurrentQuestionStartTime() != null ? session.getCurrentQuestionStartTime() : now;
        long elapsedMs = now - startTime;
        long totalMs = session.getCurrentQuestionTimeLimit() * 1000L;
        long timeRemainingMs = Math.max(0, totalMs - elapsedMs);

        int connectedCount = (int) allPlayers.stream().filter(QuizPlayer::getIsConnected).count();
        int answeredCount = currentQAnswers.size();

        return LiveQuizStateDto.builder()
                .pin(session.getPin())
                .quizId(quiz.getId())
                .quizTitle(quiz.getTitle())
                .schoolGroupId(session.getSchoolGroup() != null ? session.getSchoolGroup().getId() : null)
                .schoolGroupName(session.getSchoolGroup() != null ? session.getSchoolGroup().getGrade() + " \"" + session.getSchoolGroup().getName() + "\"" : null)
                .status(session.getStatus().name())
                .currentQuestionIndex(currentIdx)
                .totalQuestions(totalQuestions)
                .isLastQuestion(currentIdx + 1 >= totalQuestions)
                .currentQuestion(filteredQuestion)
                .timeRemainingMs(session.getStatus() == QuizSessionStatus.QUESTION_ACTIVE ? timeRemainingMs : 0L)
                .totalTimeLimitSeconds(session.getCurrentQuestionTimeLimit())
                .connectedPlayersCount(connectedCount)
                .totalAnsweredCount(answeredCount)
                .players(session.getStatus() == QuizSessionStatus.LOBBY ? playerSummaries : null)
                .topPlayers(topPlayers)
                .optionStats(optionStats)
                .groupRoster(rosterDtos.isEmpty() ? null : rosterDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public QuizPlayerStateDto getPlayerState(String pin, String playerToken) {
        LiveQuizSession session = sessionRepository.findByPin(pin)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada con PIN: " + pin));
        QuizPlayer player = playerRepository.findBySessionAndSessionToken(session, playerToken)
                .orElseThrow(() -> new ResourceNotFoundException("Jugador no encontrado"));

        return mapPlayerToStateDto(player, session);
    }

    private QuizPlayerStateDto mapPlayerToStateDto(QuizPlayer player, LiveQuizSession session) {
        int currentIdx = session.getCurrentQuestionIndex();
        Optional<QuizPlayerAnswer> ans = answerRepository.findByPlayerAndQuestionIndex(player, currentIdx);

        List<QuizPlayer> sorted = playerRepository.findBySessionOrderByTotalScoreDesc(session);
        int rank = 1;
        int scoreToNext = 0;
        for (int i = 0; i < sorted.size(); i++) {
            if (sorted.get(i).getId().equals(player.getId())) {
                rank = i + 1;
                if (i > 0) {
                    scoreToNext = sorted.get(i - 1).getTotalScore() - player.getTotalScore();
                }
                break;
            }
        }

        return QuizPlayerStateDto.builder()
                .playerToken(player.getSessionToken())
                .playerId(player.getId())
                .nickname(player.getNickname())
                .avatar(player.getAvatar())
                .totalScore(player.getTotalScore())
                .currentStreak(player.getCurrentStreak())
                .isConnected(player.getIsConnected())
                .hasAnsweredCurrentQuestion(ans.isPresent())
                .selectedOptionId(ans.map(QuizPlayerAnswer::getSelectedOptionId).orElse(null))
                .isCorrect(session.getStatus() != QuizSessionStatus.QUESTION_ACTIVE ? ans.map(QuizPlayerAnswer::getIsCorrect).orElse(null) : null)
                .pointsAwarded(ans.map(QuizPlayerAnswer::getPointsAwarded).orElse(0))
                .streakBonus(ans.map(QuizPlayerAnswer::getStreakBonus).orElse(0))
                .currentRank(rank)
                .scoreToNextRank(scoreToNext)
                .build();
    }

    private QuizQuestionDto filterQuestionForPhase(QuizQuestion q, QuizSessionStatus status) {
        List<QuizOptionDto> options = quizService.parseOptions(q.getOptionsJson());

        // In PREVIEW phase, options are hidden so students only read question prompt
        if (status == QuizSessionStatus.PREVIEW || status == QuizSessionStatus.LOBBY) {
            return QuizQuestionDto.builder()
                    .id(q.getId())
                    .questionOrder(q.getQuestionOrder())
                    .prompt(q.getPrompt())
                    .imageUrl(q.getImageUrl())
                    .timeLimitSeconds(q.getTimeLimitSeconds())
                    .points(q.getPoints())
                    .options(null)
                    .explanation(null)
                    .build();
        }

        // In QUESTION_ACTIVE phase, show options with colors/shapes, but hide isCorrect!
        if (status == QuizSessionStatus.QUESTION_ACTIVE) {
            List<QuizOptionDto> masked = options.stream()
                    .map(o -> QuizOptionDto.builder()
                            .id(o.getId())
                            .text(o.getText())
                            .color(o.getColor())
                            .shape(o.getShape())
                            .isCorrect(null)
                            .build())
                    .collect(Collectors.toList());

            return QuizQuestionDto.builder()
                    .id(q.getId())
                    .questionOrder(q.getQuestionOrder())
                    .prompt(q.getPrompt())
                    .imageUrl(q.getImageUrl())
                    .timeLimitSeconds(q.getTimeLimitSeconds())
                    .points(q.getPoints())
                    .options(masked)
                    .explanation(null)
                    .build();
        }

        // In QUESTION_CLOSED and later: show correct answers & explanation
        return QuizQuestionDto.builder()
                .id(q.getId())
                .questionOrder(q.getQuestionOrder())
                .prompt(q.getPrompt())
                .imageUrl(q.getImageUrl())
                .timeLimitSeconds(q.getTimeLimitSeconds())
                .points(q.getPoints())
                .options(options)
                .explanation(q.getExplanation())
                .build();
    }

    @Transactional(readOnly = true)
    public QuizSessionReportDto getSessionReport(String pin, User teacher) {
        LiveQuizSession session = sessionRepository.findByPin(pin)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada con PIN: " + pin));

        if (!session.getTeacher().getId().equals(teacher.getId())) {
            throw new IllegalArgumentException("No tienes permiso para ver el reporte de esta sesión.");
        }

        List<QuizPlayer> players = playerRepository.findBySessionOrderByTotalScoreDesc(session);
        List<QuizQuestion> questions = session.getQuiz().getQuestions();
        List<QuizPlayerAnswer> allAnswers = answerRepository.findBySession(session);

        int totalPlayers = players.size();
        int totalQuestions = questions.size();

        double avgScore = players.isEmpty() ? 0.0 :
                players.stream().mapToInt(QuizPlayer::getTotalScore).average().orElse(0.0);

        long totalPossibleAnswers = (long) totalPlayers * totalQuestions;
        long totalCorrect = allAnswers.stream().filter(QuizPlayerAnswer::getIsCorrect).count();
        double globalAccuracy = totalPossibleAnswers > 0 ? ((double) totalCorrect / totalPossibleAnswers) * 100.0 : 0.0;

        List<QuizSessionReportDto.QuestionReportStat> questionStats = new ArrayList<>();
        String hardestPrompt = "Ninguna";
        double lowestAccuracy = 100.0;

        for (int i = 0; i < totalQuestions; i++) {
            QuizQuestion q = questions.get(i);
            final int qIdx = i;
            List<QuizPlayerAnswer> qAnswers = allAnswers.stream()
                    .filter(a -> a.getQuestionIndex() == qIdx)
                    .collect(Collectors.toList());

            int correctCount = (int) qAnswers.stream().filter(QuizPlayerAnswer::getIsCorrect).count();
            int incorrectCount = qAnswers.size() - correctCount;
            int unansweredCount = Math.max(0, totalPlayers - qAnswers.size());

            double acc = totalPlayers > 0 ? ((double) correctCount / totalPlayers) * 100.0 : 0.0;
            double avgTime = qAnswers.isEmpty() ? 0.0 :
                    qAnswers.stream().mapToLong(QuizPlayerAnswer::getResponseTimeMs).average().orElse(0.0) / 1000.0;

            if (acc < lowestAccuracy || i == 0) {
                lowestAccuracy = acc;
                hardestPrompt = q.getPrompt();
            }

            questionStats.add(QuizSessionReportDto.QuestionReportStat.builder()
                    .questionOrder(q.getQuestionOrder())
                    .prompt(q.getPrompt())
                    .correctAnswersCount(correctCount)
                    .incorrectAnswersCount(incorrectCount)
                    .unansweredCount(unansweredCount)
                    .accuracyPercentage(Math.round(acc * 10.0) / 10.0)
                    .averageResponseTimeSeconds(Math.round(avgTime * 10.0) / 10.0)
                    .build());
        }

        List<QuizSessionReportDto.PlayerRankingReportStat> playerRankings = new ArrayList<>();
        int rank = 1;
        for (QuizPlayer p : players) {
            double pAcc = totalQuestions > 0 ? ((double) p.getCorrectAnswersCount() / totalQuestions) * 100.0 : 0.0;
            playerRankings.add(QuizSessionReportDto.PlayerRankingReportStat.builder()
                    .rank(rank++)
                    .nickname(p.getNickname())
                    .fullName(p.getStudent() != null ? p.getStudent().getFullName() : p.getNickname())
                    .totalScore(p.getTotalScore())
                    .correctCount(p.getCorrectAnswersCount())
                    .totalQuestions(totalQuestions)
                    .accuracyPercentage(Math.round(pAcc * 10.0) / 10.0)
                    .highestStreak(p.getHighestStreak())
                    .build());
        }

        return QuizSessionReportDto.builder()
                .pin(session.getPin())
                .quizTitle(session.getQuiz().getTitle())
                .schoolGroupName(session.getSchoolGroup() != null ? session.getSchoolGroup().getGrade() + " \"" + session.getSchoolGroup().getName() + "\"" : "Partida Abierta (Sin grupo)")
                .teacherName(session.getTeacher().getFullName())
                .startedAt(session.getCreatedAt())
                .endedAt(session.getEndedAt() != null ? session.getEndedAt() : LocalDateTime.now())
                .totalPlayers(totalPlayers)
                .totalQuestions(totalQuestions)
                .averageScore(Math.round(avgScore * 10.0) / 10.0)
                .globalAccuracyPercentage(Math.round(globalAccuracy * 10.0) / 10.0)
                .hardestQuestionPrompt(hardestPrompt)
                .hardestQuestionAccuracy(Math.round(lowestAccuracy * 10.0) / 10.0)
                .questionStats(questionStats)
                .playerRankings(playerRankings)
                .build();
    }

    private void notifySessionUpdate(String pin) {
        try {
            LiveQuizStateDto state = getLiveState(pin, null);
            messagingTemplate.convertAndSend("/topic/quiz/" + pin, state);
        } catch (Exception e) {
            log.warn("Failed to broadcast WebSocket update for PIN {}: {}", pin, e.getMessage());
        }
    }

    private String generateUniquePin() {
        for (int i = 0; i < 50; i++) {
            int num = 100000 + RANDOM.nextInt(900000);
            String pin = String.valueOf(num);
            if (!sessionRepository.findByPin(pin).isPresent()) {
                return pin;
            }
        }
        return String.valueOf(System.currentTimeMillis() % 1000000);
    }
}

