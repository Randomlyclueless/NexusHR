
package com.nexushr.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "payroll_records",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_payroll_employee_period",
                columnNames = {"employee_id", "pay_period"}
        )
)
public class Payroll {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull
    @Column(name = "pay_period", nullable = false, length = 7)
    private String payPeriod; // YYYY-MM

    @NotNull
    @DecimalMin("0.00")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal basicSalary;

    @DecimalMin("0.00")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal allowances = BigDecimal.ZERO;

    @DecimalMin("0.00")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal deductions = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal netPay;

    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Payroll() {}

    @PrePersist
    @PreUpdate
    public void calculateNetPay() {
        if (basicSalary != null) {
            if (allowances == null) allowances = BigDecimal.ZERO;
            if (deductions == null) deductions = BigDecimal.ZERO;

            netPay = basicSalary.add(allowances).subtract(deductions);
        }

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public Employee getEmployee() { return employee; }
    public String getPayPeriod() { return payPeriod; }
    public BigDecimal getBasicSalary() { return basicSalary; }
    public BigDecimal getAllowances() { return allowances; }
    public BigDecimal getDeductions() { return deductions; }
    public BigDecimal getNetPay() { return netPay; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public void setPayPeriod(String payPeriod) { this.payPeriod = payPeriod; }
    public void setBasicSalary(BigDecimal basicSalary) { this.basicSalary = basicSalary; }
    public void setAllowances(BigDecimal allowances) { this.allowances = allowances; }
    public void setDeductions(BigDecimal deductions) { this.deductions = deductions; }
    public void setNetPay(BigDecimal netPay) { this.netPay = netPay; }
    public void setStatus(String status) { this.status = status; }
}
