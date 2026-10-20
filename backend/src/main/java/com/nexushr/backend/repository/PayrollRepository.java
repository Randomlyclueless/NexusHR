
package com.nexushr.backend.repository;

import com.nexushr.backend.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    List<Payroll> findAllByOrderByCreatedAtDesc();

    List<Payroll> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    boolean existsByEmployeeIdAndPayPeriod(Long employeeId, String payPeriod);
}
