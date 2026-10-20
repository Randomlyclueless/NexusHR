
package com.nexushr.backend.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record PerformanceReviewRequest(
        @NotNull Long employeeId,

        @NotBlank
        @Size(max = 50)
        String reviewCycle,

        @NotNull
        @DecimalMin("1.00")
        @DecimalMax("5.00")
        BigDecimal rating,

        @NotNull
        @Min(1)
        @Max(1000)
        Integer goalsTotal,

        @NotNull
        @Min(0)
        @Max(1000)
        Integer goalsCompleted,

        @Size(max = 3000)
        String feedback
) {}
