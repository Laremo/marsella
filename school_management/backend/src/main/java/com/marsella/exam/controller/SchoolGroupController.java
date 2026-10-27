package com.marsella.exam.controller;

import com.marsella.exam.dto.AcademicPeriodDto;
import com.marsella.exam.dto.SchoolGroupRequest;
import com.marsella.exam.dto.SchoolGroupResponse;
import com.marsella.exam.dto.UpdatePeriodWeightsRequest;
import com.marsella.exam.model.User;
import com.marsella.exam.service.SchoolGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/teacher/groups")
@RequiredArgsConstructor
@Slf4j
public class SchoolGroupController {

    private final SchoolGroupService groupService;

    @GetMapping
    public ResponseEntity<List<SchoolGroupResponse>> getGroups(@AuthenticationPrincipal User teacher) {
        return ResponseEntity.ok(groupService.getTeacherGroups(teacher.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGroup(@AuthenticationPrincipal User teacher, @PathVariable Long id) {
        try {
            return ResponseEntity.ok(groupService.getGroup(teacher.getId(), id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createGroup(@AuthenticationPrincipal User teacher, @Valid @RequestBody SchoolGroupRequest request) {
        try {
            SchoolGroupResponse res = groupService.createGroup(teacher, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating group", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateGroup(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id,
            @Valid @RequestBody SchoolGroupRequest request) {
        try {
            return ResponseEntity.ok(groupService.updateGroup(teacher.getId(), id, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@AuthenticationPrincipal User teacher, @PathVariable Long id) {
        try {
            groupService.deleteGroup(teacher.getId(), id);
            return ResponseEntity.ok(Map.of("message", "Grupo eliminado con éxito"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/periods/{periodId}/weights")
    public ResponseEntity<?> updatePeriodWeights(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id,
            @PathVariable Long periodId,
            @Valid @RequestBody UpdatePeriodWeightsRequest request) {
        try {
            AcademicPeriodDto updated = groupService.updatePeriodWeights(teacher.getId(), id, periodId, request);
            return ResponseEntity.ok(updated);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/weights")
    public ResponseEntity<?> updateGroupWeights(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id,
            @RequestBody List<com.marsella.exam.dto.GroupEvaluationWeightDto> weights) {
        try {
            return ResponseEntity.ok(groupService.updateGroupEvaluationWeights(teacher.getId(), id, weights));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/periods-weights")
    public ResponseEntity<?> updatePeriodsWeights(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long id,
            @RequestBody List<AcademicPeriodDto> periodDtos) {
        try {
            return ResponseEntity.ok(groupService.updatePeriodsWeights(teacher.getId(), id, periodDtos));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
