
package com.nexushr.backend.service;

import com.nexushr.backend.dto.PayrollRequest;
import com.nexushr.backend.entity.Employee;
import com.nexushr.backend.entity.Payroll;
import com.nexushr.backend.repository.EmployeeRepository;
import com.nexushr.backend.repository.PayrollRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;

    public PayrollService(
            PayrollRepository payrollRepository,
            EmployeeRepository employeeRepository) {
        this.payrollRepository = payrollRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<Payroll> getAll(Long employeeId) {
        if (employeeId != null) {
            return payrollRepository
                    .findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        }

        return payrollRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Payroll getById(Long id) {
        return payrollRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Payroll record not found"));
    }

    @Transactional
    public Payroll create(PayrollRequest request) {
        if (payrollRepository.existsByEmployeeIdAndPayPeriod(
                request.employeeId(), request.payPeriod())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Payroll already exists for this employee and pay period");
        }

        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Employee not found"));

        BigDecimal allowances = request.allowances() == null
                ? BigDecimal.ZERO : request.allowances();

        BigDecimal deductions = request.deductions() == null
                ? BigDecimal.ZERO : request.deductions();

        if (deductions.compareTo(
                request.basicSalary().add(allowances)) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Deductions cannot exceed salary plus allowances");
        }

        Payroll payroll = new Payroll();
        payroll.setEmployee(employee);
        payroll.setPayPeriod(request.payPeriod());
        payroll.setBasicSalary(request.basicSalary());
        payroll.setAllowances(allowances);
        payroll.setDeductions(deductions);
        payroll.setStatus("DRAFT");

        return payrollRepository.save(payroll);
    }

    @Transactional
    public Payroll updateStatus(Long id, String status) {
        Payroll payroll = getById(id);

        if (!List.of("DRAFT", "APPROVED", "PAID").contains(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be DRAFT, APPROVED, or PAID");
        }

        if ("PAID".equals(payroll.getStatus())
                && !"PAID".equals(status)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A paid payroll record cannot be moved backwards");
        }

        payroll.setStatus(status);
        return payrollRepository.save(payroll);
    }
}
