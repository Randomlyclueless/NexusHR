
package com.nexushr.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public record PayrollRequest(
        @NotNull Long employeeId,

        @NotBlank
        @Pattern(regexp = "\\d{4}-(0[1-9]|1[0-2])",
                message = "Pay period must use YYYY-MM format")
        String payPeriod,

        @NotNull
        @DecimalMin("0.00")
        BigDecimal basicSalary,

        @DecimalMin("0.00")
        BigDecimal allowances,

        @DecimalMin("0.00")
        BigDecimal deductions
) {}
