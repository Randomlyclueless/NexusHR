
package com.nexushr.backend.controller;

import com.nexushr.backend.dto.PayrollRequest;
import com.nexushr.backend.entity.Payroll;
import com.nexushr.backend.service.PayrollService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @GetMapping
    public List<Payroll> getAll(
            @RequestParam(required = false) Long employeeId) {
        return payrollService.getAll(employeeId);
    }

    @GetMapping("/{id}")
    public Payroll getById(@PathVariable Long id) {
        return payrollService.getById(id);
    }

    @PostMapping
    public Payroll create(@Valid @RequestBody PayrollRequest request) {
        return payrollService.create(request);
    }

    @PatchMapping("/{id}/status")
    public Payroll updateStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request) {
        return payrollService.updateStatus(id, request.status());
    }

    public record StatusRequest(String status) {}
}
