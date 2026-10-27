package com.marsella.exam.service;

import com.marsella.exam.dto.ActivityDto.*;
import com.marsella.exam.dto.AnnualGradebookDto;
import com.marsella.exam.dto.ConsolidatedGradebookDto;
import com.marsella.exam.dto.ConsolidatedGradebookDto.StudentGradeRow;
import com.marsella.exam.model.*;
import com.marsella.exam.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicActivityService {

    private final AcademicActivityRepository activityRepository;
    private final StudentActivityScoreRepository scoreRepository;
    private final SchoolGroupRepository groupRepository;
    private final AcademicPeriodRepository periodRepository;
    private final StudentRepository studentRepository;
    private final ExamRepository examRepository;
    private final StudentSubmissionRepository submissionRepository;
    private final AttendanceRecordRepository attendanceRepository;
    private final StudentIncidentRepository incidentRepository;
    private final GroupEvaluationWeightRepository evalWeightRepository;

    @Transactional(readOnly = true)
    public List<ActivityResponse> getGroupActivities(Long teacherId, Long groupId, Long periodId) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        List<AcademicActivity> list;
        if (periodId != null) {
            list = activityRepository.findBySchoolGroupIdAndAcademicPeriodIdOrderByDueDateAscCreatedAtAsc(group.getId(), periodId);
        } else {
            list = activityRepository.findBySchoolGroupIdOrderByDueDateDescCreatedAtDesc(group.getId());
        }

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public ActivityResponse createActivity(Long teacherId, Long groupId, ActivityRequest request) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        AcademicPeriod period = periodRepository.findByIdAndSchoolGroupId(request.getAcademicPeriodId(), group.getId())
                .orElseThrow(() -> new NoSuchElementException("Período no encontrado"));

        GroupEvaluationWeight evalWeight = null;
        if (request.getEvaluationWeightId() != null) {
            evalWeight = evalWeightRepository.findById(request.getEvaluationWeightId()).orElse(null);
        }

        AcademicActivity activity = AcademicActivity.builder()
                .schoolGroup(group)
                .academicPeriod(period)
                .evaluationWeight(evalWeight)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .type(request.getType() != null ? request.getType() : ActivityType.TAREA)
                .maxPoints(request.getMaxPoints() != null && request.getMaxPoints() > 0 ? request.getMaxPoints() : 10.0)
                .dueDate(request.getDueDate())
                .isExtraPoints(Boolean.TRUE.equals(request.getIsExtraPoints()) || request.getType() == ActivityType.PUNTOS_EXTRA)
                .build();

        AcademicActivity saved = activityRepository.save(activity);
        log.info("Created academic activity '{}' for group {}", saved.getTitle(), group.getName());
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<StudentScoreItem> getActivityScores(Long teacherId, Long activityId) {
        AcademicActivity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NoSuchElementException("Actividad no encontrada"));

        // Verify teacher
        if (!activity.getSchoolGroup().getTeacher().getId().equals(teacherId)) {
            throw new NoSuchElementException("Actividad no encontrada");
        }

        List<Student> students = studentRepository.findBySchoolGroupIdOrderByFullNameAsc(activity.getSchoolGroup().getId());
        List<StudentActivityScore> existingScores = scoreRepository.findByActivityId(activity.getId());
        Map<Long, StudentActivityScore> scoreMap = existingScores.stream()
                .collect(Collectors.toMap(s -> s.getStudent().getId(), s -> s));

        List<StudentScoreItem> items = new ArrayList<>();
        for (Student s : students) {
            StudentActivityScore sc = scoreMap.get(s.getId());
            items.add(StudentScoreItem.builder()
                    .studentId(s.getId())
                    .studentName(s.getFullName())
                    .listNumber(s.getListNumber())
                    .score(sc != null ? sc.getScore() : 0.0)
                    .feedback(sc != null ? sc.getFeedback() : "")
                    .build());
        }
        return items;
    }

    @Transactional
    public List<StudentScoreItem> saveBatchScores(Long teacherId, Long activityId, SaveBatchScoresRequest request) {
        AcademicActivity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NoSuchElementException("Actividad no encontrada"));

        if (!activity.getSchoolGroup().getTeacher().getId().equals(teacherId)) {
            throw new NoSuchElementException("Actividad no encontrada");
        }

        List<Student> students = studentRepository.findBySchoolGroupIdOrderByFullNameAsc(activity.getSchoolGroup().getId());
        Map<Long, Student> studentMap = students.stream().collect(Collectors.toMap(Student::getId, s -> s));

        List<StudentActivityScore> toSave = new ArrayList<>();
        for (StudentScoreItem item : request.getScores()) {
            Student student = studentMap.get(item.getStudentId());
            if (student == null) continue;

            Optional<StudentActivityScore> existingOpt = scoreRepository.findByActivityIdAndStudentId(activity.getId(), student.getId());
            StudentActivityScore sc;
            if (existingOpt.isPresent()) {
                sc = existingOpt.get();
                sc.setScore(item.getScore() != null ? item.getScore() : 0.0);
                sc.setFeedback(item.getFeedback());
            } else {
                sc = StudentActivityScore.builder()
                        .activity(activity)
                        .student(student)
                        .score(item.getScore() != null ? item.getScore() : 0.0)
                        .feedback(item.getFeedback())
                        .build();
            }
            toSave.add(sc);
        }

        scoreRepository.saveAll(toSave);
        return getActivityScores(teacherId, activityId);
    }

    @Transactional
    public void deleteActivity(Long teacherId, Long activityId) {
        AcademicActivity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new NoSuchElementException("Actividad no encontrada"));

        if (!activity.getSchoolGroup().getTeacher().getId().equals(teacherId)) {
            throw new NoSuchElementException("Actividad no encontrada");
        }

        activityRepository.delete(activity);
    }

    /**
     * Compute the full consolidated gradebook combining:
     * - Exam averages (weighted)
     * - Activity averages (weighted)
     * - Attendance % (weighted)
     * - Conduct deductions
     * - Extra points
     */
    @Transactional(readOnly = true)
    public ConsolidatedGradebookDto getConsolidatedGradebook(Long teacherId, Long groupId, Long periodId) {
        SchoolGroup group = groupRepository.findByIdAndTeacherId(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        AcademicPeriod period = periodRepository.findByIdAndSchoolGroupId(periodId, group.getId())
                .orElseThrow(() -> new NoSuchElementException("Período no encontrado"));

        List<Student> students = studentRepository.findBySchoolGroupIdOrderByFullNameAsc(group.getId());

        // 1. Fetch activities for this period
        List<AcademicActivity> activities = activityRepository.findBySchoolGroupIdAndAcademicPeriodIdOrderByDueDateAscCreatedAtAsc(group.getId(), period.getId());
        List<AcademicActivity> normalActivities = activities.stream().filter(a -> !Boolean.TRUE.equals(a.getIsExtraPoints())).collect(Collectors.toList());
        List<AcademicActivity> extraActivities = activities.stream().filter(a -> Boolean.TRUE.equals(a.getIsExtraPoints())).collect(Collectors.toList());

        List<StudentActivityScore> allScores = scoreRepository.findByPeriodId(period.getId());
        Map<String, StudentActivityScore> scoreLookup = allScores.stream()
                .collect(Collectors.toMap(sc -> sc.getActivity().getId() + "_" + sc.getStudent().getId(), sc -> sc, (a, b) -> a));

        // 2. Fetch exams matching this group / grade / block
        List<Exam> teacherExams = examRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId);
        List<Exam> matchingExams = teacherExams.stream()
                .filter(e -> {
                    boolean matchGrade = e.getGrade() == null || e.getGrade().trim().equalsIgnoreCase(group.getGrade().trim());
                    boolean matchGroup = e.getGroupName() == null || e.getGroupName().trim().equalsIgnoreCase(group.getName().replace("Grupo", "").trim()) || e.getGroupName().trim().equalsIgnoreCase(group.getName().trim());
                    boolean matchBlock = e.getBlock() == null || e.getBlock().equals(period.getPeriodNumber());
                    return matchGrade && (matchGroup || e.getBlock() != null && e.getBlock().equals(period.getPeriodNumber()));
                })
                .collect(Collectors.toList());

        // Submissions lookup: examId + "_" + studentName.toLowerCase() -> submission
        Map<String, StudentSubmission> subLookup = new HashMap<>();
        for (Exam ex : matchingExams) {
            List<StudentSubmission> subs = submissionRepository.findByExamIdOrderByStartedAtDesc(ex.getId());
            for (StudentSubmission s : subs) {
                if (s.getStudentName() != null) {
                    String key = ex.getId() + "_" + s.getStudentName().trim().toLowerCase();
                    subLookup.putIfAbsent(key, s);
                }
            }
        }

        // 3. Attendance records
        List<AttendanceRecord> attendanceRecords = attendanceRepository.findBySchoolGroupIdAndAcademicPeriodIdOrderByDateAsc(group.getId(), period.getId());
        Map<Long, List<AttendanceRecord>> attLookup = attendanceRecords.stream()
                .collect(Collectors.groupingBy(r -> r.getStudent().getId()));

        // 4. Incidents (conduct deductions)
        List<StudentIncident> incidents = incidentRepository.findBySchoolGroupIdAndAcademicPeriodIdOrderByDateDescCreatedAtDesc(group.getId(), period.getId());
        Map<Long, List<StudentIncident>> incLookup = incidents.stream()
                .collect(Collectors.groupingBy(i -> i.getStudent().getId()));

        // Group evaluation weights (applied equally to every block)
        List<GroupEvaluationWeight> groupWeights = evalWeightRepository.findBySchoolGroupIdOrderByIdAsc(group.getId());
        double examWeight = 40.0;
        double actWeight = 40.0;
        double attWeight = 20.0;

        if (groupWeights != null && !groupWeights.isEmpty()) {
            double eSum = groupWeights.stream().filter(w -> w.getCategory() == EvaluationCategory.EXAMEN).mapToDouble(GroupEvaluationWeight::getPercentage).sum();
            double aSum = groupWeights.stream().filter(w -> w.getCategory() == EvaluationCategory.ACTIVIDAD).mapToDouble(GroupEvaluationWeight::getPercentage).sum();
            double attSum = groupWeights.stream().filter(w -> w.getCategory() == EvaluationCategory.ASISTENCIA).mapToDouble(GroupEvaluationWeight::getPercentage).sum();
            if (eSum + aSum + attSum > 0) {
                examWeight = eSum;
                actWeight = aSum;
                attWeight = attSum;
            }
        } else if (period.getExamWeight() != null) {
            examWeight = period.getExamWeight();
            actWeight = period.getActivityWeight() != null ? period.getActivityWeight() : 40.0;
            attWeight = period.getAttendanceWeight() != null ? period.getAttendanceWeight() : 20.0;
        }

        double targetScale = period.getTargetScale() != null ? period.getTargetScale() : 10.0; // scale 10.0 or 100.0

        List<StudentGradeRow> rows = new ArrayList<>();
        double sumFinal = 0.0;
        int approved = 0;
        int failed = 0;

        for (Student student : students) {
            // A) Exams Component
            double examScoreSum = 0.0;
            int examCount = 0;
            for (Exam ex : matchingExams) {
                String key = ex.getId() + "_" + student.getFullName().trim().toLowerCase();
                StudentSubmission sub = subLookup.get(key);
                if (sub != null && sub.getScore() != null && sub.getMaxScore() != null && sub.getMaxScore() > 0) {
                    double normalized = (sub.getScore() / sub.getMaxScore()) * 10.0; // normalize to 0-10
                    examScoreSum += normalized;
                    examCount++;
                }
            }
            double examAvg = examCount > 0 ? (examScoreSum / examCount) : 10.0; // default 10 if no exams
            double examPoints = Math.round(((examAvg / 10.0) * (examWeight / 100.0) * targetScale) * 100.0) / 100.0;

            // B) Activities Component
            double actScoreSum = 0.0;
            int actCount = 0;
            for (AcademicActivity act : normalActivities) {
                StudentActivityScore sc = scoreLookup.get(act.getId() + "_" + student.getId());
                double scoreVal = sc != null && sc.getScore() != null ? sc.getScore() : 0.0;
                double max = act.getMaxPoints() > 0 ? act.getMaxPoints() : 10.0;
                double normalized = (scoreVal / max) * 10.0;
                actScoreSum += normalized;
                actCount++;
            }
            double actAvg = actCount > 0 ? (actScoreSum / actCount) : 10.0;
            double actPoints = Math.round(((actAvg / 10.0) * (actWeight / 100.0) * targetScale) * 100.0) / 100.0;

            // C) Attendance Component
            List<AttendanceRecord> aList = attLookup.getOrDefault(student.getId(), Collections.emptyList());
            int totalDays = aList.size();
            double presentCount = 0;
            for (AttendanceRecord r : aList) {
                if (r.getStatus() == AttendanceStatus.PRESENT || r.getStatus() == AttendanceStatus.JUSTIFIED) {
                    presentCount += 1.0;
                } else if (r.getStatus() == AttendanceStatus.LATE) {
                    presentCount += 0.5;
                }
            }
            double attPct = totalDays > 0 ? (presentCount / totalDays) * 100.0 : 100.0;
            double attPoints = Math.round(((attPct / 100.0) * (attWeight / 100.0) * targetScale) * 100.0) / 100.0;

            // D) Extra Points
            double extraPts = 0.0;
            for (AcademicActivity act : extraActivities) {
                StudentActivityScore sc = scoreLookup.get(act.getId() + "_" + student.getId());
                if (sc != null && sc.getScore() != null) {
                    extraPts += sc.getScore();
                }
            }

            // E) Conduct Deductions
            List<StudentIncident> iList = incLookup.getOrDefault(student.getId(), Collections.emptyList());
            double penalties = 0.0;
            for (StudentIncident inc : iList) {
                if (inc.getPointDeduction() != null) {
                    penalties += inc.getPointDeduction();
                }
            }

            // Final Grade
            double rawFinal = examPoints + actPoints + attPoints + extraPts - penalties;
            if (rawFinal < 0) rawFinal = 0;
            if (rawFinal > targetScale) rawFinal = targetScale;
            double finalGrade = Math.round(rawFinal * 10.0) / 10.0;

            boolean isApproved = finalGrade >= (targetScale * 0.6); // 6.0 in 10 scale
            if (isApproved) approved++; else failed++;
            sumFinal += finalGrade;

            rows.add(StudentGradeRow.builder()
                    .studentId(student.getId())
                    .studentName(student.getFullName())
                    .listNumber(student.getListNumber())
                    .examsAverage(Math.round(examAvg * 10.0) / 10.0)
                    .examsPoints(examPoints)
                    .activitiesAverage(Math.round(actAvg * 10.0) / 10.0)
                    .activitiesPoints(actPoints)
                    .attendancePercentage(Math.round(attPct * 10.0) / 10.0)
                    .attendancePoints(attPoints)
                    .extraPoints(extraPts)
                    .conductPenalties(penalties)
                    .finalGrade(finalGrade)
                    .isApproved(isApproved)
                    .build());
        }

        double groupAvg = students.size() > 0 ? Math.round((sumFinal / students.size()) * 10.0) / 10.0 : 0.0;

        return ConsolidatedGradebookDto.builder()
                .schoolGroupId(group.getId())
                .groupName(group.getName())
                .grade(group.getGrade())
                .subject(group.getSubject())
                .academicPeriodId(period.getId())
                .periodName(period.getName())
                .examWeight(examWeight)
                .activityWeight(actWeight)
                .attendanceWeight(attWeight)
                .targetScale(targetScale)
                .totalStudents(students.size())
                .groupAverage(groupAvg)
                .approvedCount(approved)
                .failedCount(failed)
                .rows(rows)
                .build();
    }

    public ActivityResponse mapToResponse(AcademicActivity act) {
        int count = scoreRepository.findByActivityId(act.getId()).size();
        return ActivityResponse.builder()
                .id(act.getId())
                .schoolGroupId(act.getSchoolGroup().getId())
                .academicPeriodId(act.getAcademicPeriod().getId())
                .periodName(act.getAcademicPeriod().getName())
                .title(act.getTitle())
                .description(act.getDescription())
                .type(act.getType())
                .typeLabel(act.getType() != null ? act.getType().getLabel() : "")
                .maxPoints(act.getMaxPoints())
                .dueDate(act.getDueDate())
                .isExtraPoints(act.getIsExtraPoints())
                .evaluationWeightId(act.getEvaluationWeight() != null ? act.getEvaluationWeight().getId() : null)
                .evaluationWeightName(act.getEvaluationWeight() != null ? act.getEvaluationWeight().getName() : null)
                .gradedCount(count)
                .createdAt(act.getCreatedAt())
                .build();
    }

    /**
     * Compute course-wide annual gradebook, weighting each period/block by its periodWeight.
     */
    @Transactional(readOnly = true)
    public AnnualGradebookDto getAnnualGradebook(Long teacherId, Long groupId) {
        SchoolGroup group = groupRepository.findByIdAndTeacherIdWithPeriods(groupId, teacherId)
                .orElseThrow(() -> new NoSuchElementException("Grupo no encontrado"));

        List<Student> students = studentRepository.findBySchoolGroupIdOrderByFullNameAsc(group.getId());
        List<AcademicPeriod> periods = group.getPeriods();

        // Calculate consolidated gradebook for each period
        Map<Long, ConsolidatedGradebookDto> periodGradebooks = new HashMap<>();
        for (AcademicPeriod p : periods) {
            periodGradebooks.put(p.getId(), getConsolidatedGradebook(teacherId, groupId, p.getId()));
        }

        List<AnnualGradebookDto.PeriodColumnInfo> periodColumns = periods.stream()
                .map(p -> AnnualGradebookDto.PeriodColumnInfo.builder()
                        .periodId(p.getId())
                        .name(p.getName())
                        .periodNumber(p.getPeriodNumber())
                        .periodWeight(p.getPeriodWeight() != null ? p.getPeriodWeight() : (100.0 / Math.max(1, periods.size())))
                        .build())
                .collect(Collectors.toList());

        List<AnnualGradebookDto.AnnualStudentRow> rows = new ArrayList<>();
        double sumAnnual = 0.0;
        int approved = 0;
        int failed = 0;

        for (Student student : students) {
            Map<Long, Double> periodGrades = new HashMap<>();
            double weightedAnnualSum = 0.0;
            double totalWeightSum = 0.0;

            for (AcademicPeriod p : periods) {
                ConsolidatedGradebookDto gb = periodGradebooks.get(p.getId());
                double grade = 0.0;
                if (gb != null && gb.getRows() != null) {
                    for (StudentGradeRow row : gb.getRows()) {
                        if (row.getStudentId().equals(student.getId())) {
                            grade = row.getFinalGrade();
                            break;
                        }
                    }
                }
                periodGrades.put(p.getId(), grade);
                double pWeight = p.getPeriodWeight() != null ? p.getPeriodWeight() : (100.0 / Math.max(1, periods.size()));
                weightedAnnualSum += (grade * (pWeight / 100.0));
                totalWeightSum += pWeight;
            }

            double finalAnnualGrade = totalWeightSum > 0 ? (weightedAnnualSum / (totalWeightSum / 100.0)) : 0.0;
            finalAnnualGrade = Math.round(finalAnnualGrade * 100.0) / 100.0;
            boolean isApproved = finalAnnualGrade >= 6.0;

            if (isApproved) approved++; else failed++;
            sumAnnual += finalAnnualGrade;

            rows.add(AnnualGradebookDto.AnnualStudentRow.builder()
                    .studentId(student.getId())
                    .studentName(student.getFullName())
                    .listNumber(student.getListNumber())
                    .periodGrades(periodGrades)
                    .finalAnnualGrade(finalAnnualGrade)
                    .isApproved(isApproved)
                    .build());
        }

        double groupAverage = !students.isEmpty() ? Math.round((sumAnnual / students.size()) * 10.0) / 10.0 : 0.0;

        return AnnualGradebookDto.builder()
                .schoolGroupId(group.getId())
                .groupName(group.getName())
                .grade(group.getGrade())
                .subject(group.getSubject())
                .schoolYear(group.getSchoolYear())
                .periods(periodColumns)
                .rows(rows)
                .groupAverage(groupAverage)
                .approvedCount(approved)
                .failedCount(failed)
                .build();
    }
}
