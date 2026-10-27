package com.marsella.exam.controller;

import com.marsella.exam.dto.BulkImportStudentsRequest;
import com.marsella.exam.dto.StudentDto;
import com.marsella.exam.model.User;
import com.marsella.exam.service.StudentManagementService;
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
@RequestMapping("/api/teacher/groups/{groupId}/students")
@RequiredArgsConstructor
@Slf4j
public class StudentManagementController {

    private final StudentManagementService studentService;

    @GetMapping
    public ResponseEntity<?> getStudents(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId) {
        try {
            List<StudentDto> students = studentService.getGroupStudents(teacher.getId(), groupId);
            return ResponseEntity.ok(students);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> addStudent(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @Valid @RequestBody StudentDto dto) {
        try {
            StudentDto created = studentService.addStudent(teacher.getId(), groupId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{studentId}")
    public ResponseEntity<?> updateStudent(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @PathVariable Long studentId,
            @Valid @RequestBody StudentDto dto) {
        try {
            return ResponseEntity.ok(studentService.updateStudent(teacher.getId(), groupId, studentId, dto));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{studentId}")
    public ResponseEntity<?> deleteStudent(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @PathVariable Long studentId) {
        try {
            studentService.deleteStudent(teacher.getId(), groupId, studentId);
            return ResponseEntity.ok(Map.of("message", "Alumno eliminado del grupo"));
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/bulk-import")
    public ResponseEntity<?> bulkImportStudents(
            @AuthenticationPrincipal User teacher,
            @PathVariable Long groupId,
            @RequestBody BulkImportStudentsRequest request) {
        try {
            Map<String, Object> result = studentService.bulkImportStudents(teacher.getId(), groupId, request);
            return ResponseEntity.ok(result);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error bulk importing students into group {}", groupId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al importar alumnos: " + e.getMessage()));
        }
    }
}
