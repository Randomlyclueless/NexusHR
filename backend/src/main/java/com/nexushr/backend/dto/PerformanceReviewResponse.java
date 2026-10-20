
package com.nexushr.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PerformanceReviewResponse(
        Long id,
        Long employeeId,
        String employeeName,
        String department,
        String jobTitle,
        String reviewCycle,
        BigDecimal rating,
        Integer goalsTotal,
        Integer goalsCompleted,
        String feedback,
        String status,
        LocalDateTime createdAt
) {}
