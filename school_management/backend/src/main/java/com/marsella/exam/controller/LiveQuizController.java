package com.marsella.exam.controller;

import com.marsella.exam.dto.JoinQuizRequest;
import com.marsella.exam.dto.LiveQuizStateDto;
import com.marsella.exam.dto.QuizPlayerStateDto;
import com.marsella.exam.dto.SubmitQuizAnswerRequest;
import com.marsella.exam.service.LiveQuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/quiz/live")
@RequiredArgsConstructor
@Slf4j
public class LiveQuizController {

    private final LiveQuizService liveQuizService;

    @GetMapping("/{pin}/state")
    public ResponseEntity<LiveQuizStateDto> getLiveState(
            @PathVariable String pin,
            @RequestParam(required = false) String playerToken) {
        LiveQuizStateDto state = liveQuizService.getLiveState(pin, playerToken);
        return ResponseEntity.ok(state);
    }

    @GetMapping("/{pin}/check")
    public ResponseEntity<Map<String, Object>> checkSession(@PathVariable String pin) {
        try {
            LiveQuizStateDto state = liveQuizService.getLiveState(pin, null);
            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "status", state.getStatus(),
                    "quizTitle", state.getQuizTitle(),
                    "playerCount", state.getConnectedPlayersCount() != null ? state.getConnectedPlayersCount() : 0
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("valid", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{pin}/join")
    public ResponseEntity<QuizPlayerStateDto> joinQuiz(
            @PathVariable String pin,
            @Valid @RequestBody JoinQuizRequest request) {
        request.setPin(pin);
        QuizPlayerStateDto playerState = liveQuizService.joinQuiz(request);
        return ResponseEntity.ok(playerState);
    }

    @PostMapping("/{pin}/answer")
    public ResponseEntity<QuizPlayerStateDto> submitAnswer(
            @PathVariable String pin,
            @Valid @RequestBody SubmitQuizAnswerRequest request) {
        QuizPlayerStateDto playerState = liveQuizService.submitAnswer(pin, request);
        return ResponseEntity.ok(playerState);
    }

    @PostMapping("/{pin}/heartbeat")
    public ResponseEntity<Void> heartbeat(
            @PathVariable String pin,
            @RequestParam String playerToken) {
        liveQuizService.heartbeat(pin, playerToken);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{pin}/player/{token}")
    public ResponseEntity<QuizPlayerStateDto> getPlayerState(
            @PathVariable String pin,
            @PathVariable String token) {
        QuizPlayerStateDto state = liveQuizService.getPlayerState(pin, token);
        return ResponseEntity.ok(state);
    }
}

