package com.marsella.exam.controller;

import com.marsella.exam.dto.ActivityDto.*;
import com.marsella.exam.dto.AttendanceDto.*;
import com.marsella.exam.dto.ConsolidatedGradebookDto;
import com.marsella.exam.dto.IncidentDto;
import com.marsella.exam.model.User;
import com.marsella.exam.service.AcademicActivityService;
import com.marsella.exam.service.AttendanceService;
import com.marsella.exam.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/teacher/groups/{groupId}")
@RequiredArgsConstructor
@Slf4j
public class AcademicManagementController {

    private final AttendanceService attendanceService;
    private final IncidentService incidentService;
    private final AcademicActivityService activityService;

    // --- ATTENDANCE ---

    @GetMapping("/attendance")
    public ResponseEntity<?> getAttendance(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            LocalDate targetDate = date != null ? date : LocalDate.now();
            return ResponseEntity.ok(attendanceService.getDailyAttendance(teacher.getId(), groupId, targetDate));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/attendance")
    public ResponseEntity<?> saveAttendance(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @Valid @RequestBody DailyAttendanceRequest request) {
        try {
            return ResponseEntity.ok(attendanceService.saveDailyAttendance(teacher.getId(), groupId, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/attendance/summary")
    public ResponseEntity<?> getAttendanceSummary(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @RequestParam Long periodId) {
        try {
            List<StudentAttendanceSummary> summary = attendanceService.getPeriodAttendanceSummary(teacher.getId(), groupId, periodId);
            return ResponseEntity.ok(summary);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // --- INCIDENTS & WARNINGS ---

    @GetMapping("/incidents")
    public ResponseEntity<?> getIncidents(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @RequestParam(required = false) Long periodId) {
        try {
            return ResponseEntity.ok(incidentService.getGroupIncidents(teacher.getId(), groupId, periodId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/incidents")
    public ResponseEntity<?> createIncident(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @Valid @RequestBody IncidentDto dto) {
        try {
            IncidentDto created = incidentService.createIncident(teacher.getId(), groupId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/incidents/{incidentId}")
    public ResponseEntity<?> deleteIncident(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @PathVariable Long incidentId) {
        try {
            incidentService.deleteIncident(teacher.getId(), groupId, incidentId);
            return ResponseEntity.ok(Map.of("message", "Incidencia eliminada con éxito"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // --- ACTIVITIES & EXTRA POINTS ---

    @GetMapping("/activities")
    public ResponseEntity<?> getActivities(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @RequestParam(required = false) Long periodId) {
        try {
            return ResponseEntity.ok(activityService.getGroupActivities(teacher.getId(), groupId, periodId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/activities")
    public ResponseEntity<?> createActivity(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @Valid @RequestBody ActivityRequest request) {
        try {
            ActivityResponse res = activityService.createActivity(teacher.getId(), groupId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/activities/{activityId}/scores")
    public ResponseEntity<?> getActivityScores(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @PathVariable Long activityId) {
        try {
            return ResponseEntity.ok(activityService.getActivityScores(teacher.getId(), activityId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/activities/{activityId}/scores")
    public ResponseEntity<?> saveActivityScores(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @PathVariable Long activityId,
            @Valid @RequestBody SaveBatchScoresRequest request) {
        try {
            return ResponseEntity.ok(activityService.saveBatchScores(teacher.getId(), activityId, request));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/activities/{activityId}")
    public ResponseEntity<?> deleteActivity(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @PathVariable Long activityId) {
        try {
            activityService.deleteActivity(teacher.getId(), activityId);
            return ResponseEntity.ok(Map.of("message", "Actividad eliminada con éxito"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // --- CONSOLIDATED GRADEBOOK ---

    @GetMapping("/gradebook")
    public ResponseEntity<?> getConsolidatedGradebook(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @RequestParam Long periodId) {
        try {
            ConsolidatedGradebookDto gradebook = activityService.getConsolidatedGradebook(teacher.getId(), groupId, periodId);
            return ResponseEntity.ok(gradebook);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/annual-gradebook")
    public ResponseEntity<?> getAnnualGradebook(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId) {
        try {
            return ResponseEntity.ok(activityService.getAnnualGradebook(teacher.getId(), groupId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }
}
