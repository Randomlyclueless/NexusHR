
package com.nexushr.backend.repository;

import com.nexushr.backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository
        extends JpaRepository<Attendance, Long> {

    List<Attendance> findByDate(LocalDate date);

    List<Attendance> findByEmployeeId(Long employeeId);

    Optional<Attendance> findByEmployeeIdAndDate(
            Long employeeId,
            LocalDate date
    );
    Optional<Attendance> findByEmployee_IdAndDate(Long employeeId, LocalDate date);

    boolean existsByEmployeeIdAndDate(
            Long employeeId,
            LocalDate date
    );
}
