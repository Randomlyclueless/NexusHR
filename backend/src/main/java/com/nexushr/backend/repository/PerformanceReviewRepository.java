
package com.nexushr.backend.repository;

import com.nexushr.backend.entity.PerformanceReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PerformanceReviewRepository
        extends JpaRepository<PerformanceReview, Long> {

    List<PerformanceReview> findAllByOrderByCreatedAtDesc();

    boolean existsByEmployeeIdAndReviewCycle(
            Long employeeId,
            String reviewCycle
    );
}
