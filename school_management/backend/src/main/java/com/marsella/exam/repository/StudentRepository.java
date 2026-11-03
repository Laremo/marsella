package com.marsella.exam.repository;

import com.marsella.exam.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findBySchoolGroupIdOrderByFullNameAsc(Long schoolGroupId);

    Optional<Student> findByIdAndSchoolGroupId(Long id, Long schoolGroupId);

    boolean existsBySchoolGroupIdAndFullNameIgnoreCase(Long schoolGroupId, String fullName);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.schoolGroup.id = :groupId")
    long countBySchoolGroupId(@Param("groupId") Long groupId);
}
