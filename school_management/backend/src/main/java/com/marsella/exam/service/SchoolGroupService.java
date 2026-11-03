package com.marsella.exam.service;

import com.marsella.exam.dto.AcademicPeriodDto;
import com.marsella.exam.dto.SchoolGroupRequest;
import com.marsella.exam.dto.SchoolGroupResponse;
import com.marsella.exam.dto.GroupEvaluationWeightDto;
import com.marsella.exam.dto.UpdatePeriodWeightsRequest;
import com.marsella.exam.model.*;
import com.marsella.exam.repository.AcademicPeriodRepository;
import com.marsella.exam.repository.GroupEvaluationWeightRepository;
import com.marsella.exam.repository.SchoolGroupRepository;
import com.marsella.exam.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchoolGroupService {

    private final SchoolGroupRepository groupRepository;
    private final AcademicPeriodRepository periodRepository;
    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public List<SchoolGroupResponse> getTeacherGroups(Long teacherId) {
        List<SchoolGroup> groups = groupRepository.findByTeacherIdOrderByGradeAscNameAsc(teacherId);
        return groups.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SchoolGroupResponse getGroup(Long teacherId, Long groupId) {
        SchoolGroup group = groupRepository.findByIdAndTeacherIdWithPeriods(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));
        return mapToResponse(group);
    }

    @Transactional
    public SchoolGroupResponse createGroup(User teacher, SchoolGroupRequest request) {
        PeriodType pType = request.getPeriodType() != null ? request.getPeriodType() : PeriodType.TRIMESTRE;
        int totalPeriods = request.getTotalPeriods() != null && request.getTotalPeriods() > 0
                ? request.getTotalPeriods()
                : pType.getDefaultCount();

        SchoolGroup group = SchoolGroup.builder()
                .teacher(teacher)
                .name(request.getName().trim())
                .grade(request.getGrade().trim())
                .subject(request.getSubject() != null ? request.getSubject().trim() : "General")
                .shift(request.getShift() != null ? request.getShift().trim() : "Matutino")
                .schoolYear(request.getSchoolYear() != null ? request.getSchoolYear().trim() : "2026-2027")
                .periodType(pType)
                .totalPeriods(totalPeriods)
                .description(request.getDescription())
                .build();

        // Group evaluation weights (apply equally to all blocks)
        List<GroupEvaluationWeight> evalWeights = new ArrayList<>();
        if (request.getEvaluationWeights() != null && !request.getEvaluationWeights().isEmpty()) {
            for (GroupEvaluationWeightDto wDto : request.getEvaluationWeights()) {
                if (wDto.getName() != null && !wDto.getName().trim().isBlank()) {
                    evalWeights.add(GroupEvaluationWeight.builder()
                            .schoolGroup(group)
                            .name(wDto.getName().trim())
                            .percentage(wDto.getPercentage() != null ? wDto.getPercentage() : 0.0)
                            .category(wDto.getCategory() != null ? wDto.getCategory() : EvaluationCategory.ACTIVIDAD)
                            .build());
                }
            }
        } else {
            // Default initial weights if not customized
            evalWeights.add(GroupEvaluationWeight.builder().schoolGroup(group).name("Exámenes").percentage(40.0).category(EvaluationCategory.EXAMEN).build());
            evalWeights.add(GroupEvaluationWeight.builder().schoolGroup(group).name("Tareas y Actividades").percentage(40.0).category(EvaluationCategory.ACTIVIDAD).build());
            evalWeights.add(GroupEvaluationWeight.builder().schoolGroup(group).name("Asistencia").percentage(20.0).category(EvaluationCategory.ASISTENCIA).build());
        }
        group.setEvaluationWeights(evalWeights);

        // Generate periods with weights towards final grade
        List<AcademicPeriod> periods = new ArrayList<>();
        List<String> customNames = request.getPeriodNames();
        List<Double> pWeights = request.getPeriodWeights();
        double defaultPWeight = Math.round((100.0 / totalPeriods) * 10.0) / 10.0;

        for (int i = 1; i <= totalPeriods; i++) {
            String periodName;
            if (customNames != null && customNames.size() >= i && customNames.get(i - 1) != null && !customNames.get(i - 1).isBlank()) {
                periodName = customNames.get(i - 1).trim();
            } else {
                periodName = "Período " + i;
            }

            double periodWeight;
            if (pWeights != null && pWeights.size() >= i && pWeights.get(i - 1) != null) {
                periodWeight = pWeights.get(i - 1);
            } else {
                periodWeight = (i == totalPeriods) ? (100.0 - defaultPWeight * (totalPeriods - 1)) : defaultPWeight;
            }

            AcademicPeriod period = AcademicPeriod.builder()
                    .schoolGroup(group)
                    .periodNumber(i)
                    .name(periodName)
                    .isCurrent(i == 1) // First period is active by default
                    .periodWeight(periodWeight)
                    .examWeight(40.0)
                    .activityWeight(40.0)
                    .attendanceWeight(20.0)
                    .conductWeight(0.0)
                    .targetScale(10.0)
                    .build();
            periods.add(period);
        }
        group.setPeriods(periods);

        SchoolGroup saved = groupRepository.save(group);
        log.info("Created new school group {} (Grade {}) with {} periods for teacher {}",
                saved.getName(), saved.getGrade(), periods.size(), teacher.getUsername());
        return mapToResponse(saved);
    }

    @Transactional
    public SchoolGroupResponse updateGroup(Long teacherId, Long groupId, SchoolGroupRequest request) {
        SchoolGroup group = groupRepository.findByIdAndTeacherIdWithPeriods(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        group.setName(request.getName().trim());
        group.setGrade(request.getGrade().trim());
        if (request.getSubject() != null) group.setSubject(request.getSubject().trim());
        if (request.getShift() != null) group.setShift(request.getShift().trim());
        if (request.getSchoolYear() != null) group.setSchoolYear(request.getSchoolYear().trim());
        if (request.getDescription() != null) group.setDescription(request.getDescription().trim());

        SchoolGroup saved = groupRepository.save(group);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteGroup(Long teacherId, Long groupId) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));
        groupRepository.delete(group);
        log.info("Deleted school group id {} by teacher id {}", groupId, teacherId);
    }

    @Transactional
    public AcademicPeriodDto updatePeriodWeights(Long teacherId, Long groupId, Long periodId, UpdatePeriodWeightsRequest request) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        AcademicPeriod period = periodRepository.findByIdAndSchoolGroupId(periodId, group.getId())
                .orElseThrow(() -> new NoSuchElementException("Período no encontrado"));

        if (request.getName() != null && !request.getName().isBlank()) {
            period.setName(request.getName().trim());
        }
        if (request.getStartDate() != null) period.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) period.setEndDate(request.getEndDate());
        if (request.getIsCurrent() != null) {
            if (Boolean.TRUE.equals(request.getIsCurrent())) {
                // Set all other periods in the group to not current
                List<AcademicPeriod> groupPeriods = periodRepository.findBySchoolGroupIdOrderByPeriodNumberAsc(group.getId());
                for (AcademicPeriod p : groupPeriods) {
                    p.setIsCurrent(p.getId().equals(period.getId()));
                }
                periodRepository.saveAll(groupPeriods);
            }
            period.setIsCurrent(request.getIsCurrent());
        }

        if (request.getPeriodWeight() != null) period.setPeriodWeight(request.getPeriodWeight());
        if (request.getExamWeight() != null) period.setExamWeight(request.getExamWeight());
        if (request.getActivityWeight() != null) period.setActivityWeight(request.getActivityWeight());
        if (request.getAttendanceWeight() != null) period.setAttendanceWeight(request.getAttendanceWeight());
        if (request.getConductWeight() != null) period.setConductWeight(request.getConductWeight());
        if (request.getTargetScale() != null) period.setTargetScale(request.getTargetScale());

        AcademicPeriod saved = periodRepository.save(period);
        return mapPeriodToDto(saved);
    }

    @Transactional
    public List<GroupEvaluationWeightDto> updateGroupEvaluationWeights(Long teacherId, Long groupId, List<GroupEvaluationWeightDto> weights) {
        SchoolGroup group = groupRepository.findByIdAndTeacherIdWithPeriods(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        group.getEvaluationWeights().clear();
        if (weights != null) {
            for (GroupEvaluationWeightDto w : weights) {
                if (w.getName() != null && !w.getName().trim().isBlank()) {
                    group.getEvaluationWeights().add(GroupEvaluationWeight.builder()
                            .schoolGroup(group)
                            .name(w.getName().trim())
                            .percentage(w.getPercentage() != null ? w.getPercentage() : 0.0)
                            .category(w.getCategory() != null ? w.getCategory() : EvaluationCategory.ACTIVIDAD)
                            .build());
                }
            }
        }
        SchoolGroup saved = groupRepository.save(group);
        return saved.getEvaluationWeights().stream().map(this::mapWeightToDto).collect(Collectors.toList());
    }

    @Transactional
    public List<AcademicPeriodDto> updatePeriodsWeights(Long teacherId, Long groupId, List<AcademicPeriodDto> periodDtos) {
        SchoolGroup group = groupRepository.findByIdAndTeacherIdWithPeriods(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        Map<Long, AcademicPeriod> periodMap = group.getPeriods().stream()
                .collect(Collectors.toMap(AcademicPeriod::getId, p -> p));

        for (AcademicPeriodDto dto : periodDtos) {
            if (dto.getId() != null && periodMap.containsKey(dto.getId())) {
                AcademicPeriod p = periodMap.get(dto.getId());
                if (dto.getPeriodWeight() != null) p.setPeriodWeight(dto.getPeriodWeight());
                if (dto.getName() != null && !dto.getName().trim().isBlank()) p.setName(dto.getName().trim());
                if (dto.getStartDate() != null) p.setStartDate(dto.getStartDate());
                if (dto.getEndDate() != null) p.setEndDate(dto.getEndDate());
                if (dto.getIsCurrent() != null) p.setIsCurrent(dto.getIsCurrent());
            }
        }
        SchoolGroup saved = groupRepository.save(group);
        return saved.getPeriods().stream().map(this::mapPeriodToDto).collect(Collectors.toList());
    }

    public SchoolGroupResponse mapToResponse(SchoolGroup group) {
        int studentCount = (int) studentRepository.countBySchoolGroupId(group.getId());
        List<AcademicPeriodDto> periodDtos = (group.getPeriods() != null ? group.getPeriods() : new ArrayList<AcademicPeriod>())
                .stream().map(this::mapPeriodToDto).collect(Collectors.toList());
        List<GroupEvaluationWeightDto> weightDtos = (group.getEvaluationWeights() != null ? group.getEvaluationWeights() : new ArrayList<GroupEvaluationWeight>())
                .stream().map(this::mapWeightToDto).collect(Collectors.toList());

        return SchoolGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .grade(group.getGrade())
                .subject(group.getSubject())
                .shift(group.getShift())
                .schoolYear(group.getSchoolYear())
                .periodType(group.getPeriodType())
                .periodTypeLabel(group.getPeriodType() != null && group.getPeriodType() != PeriodType.PERSONALIZADO ? group.getPeriodType().getLabel() : "Períodos")
                .totalPeriods(group.getTotalPeriods())
                .description(group.getDescription())
                .studentCount(studentCount)
                .periods(periodDtos)
                .evaluationWeights(weightDtos)
                .createdAt(group.getCreatedAt())
                .build();
    }

    public AcademicPeriodDto mapPeriodToDto(AcademicPeriod p) {
        return AcademicPeriodDto.builder()
                .id(p.getId())
                .periodNumber(p.getPeriodNumber())
                .name(p.getName())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .isCurrent(p.getIsCurrent())
                .periodWeight(p.getPeriodWeight())
                .examWeight(p.getExamWeight())
                .activityWeight(p.getActivityWeight())
                .attendanceWeight(p.getAttendanceWeight())
                .conductWeight(p.getConductWeight())
                .targetScale(p.getTargetScale())
                .build();
    }

    public GroupEvaluationWeightDto mapWeightToDto(GroupEvaluationWeight w) {
        return GroupEvaluationWeightDto.builder()
                .id(w.getId())
                .name(w.getName())
                .percentage(w.getPercentage())
                .category(w.getCategory())
                .build();
    }
}
