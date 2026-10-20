
package com.nexushr.backend.service;

import com.nexushr.backend.dto.PerformanceReviewRequest;
import com.nexushr.backend.dto.PerformanceReviewResponse;
import com.nexushr.backend.entity.Employee;
import com.nexushr.backend.entity.PerformanceReview;
import com.nexushr.backend.repository.EmployeeRepository;
import com.nexushr.backend.repository.PerformanceReviewRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PerformanceReviewService {

    private final PerformanceReviewRepository reviewRepository;
    private final EmployeeRepository employeeRepository;

    public PerformanceReviewService(
            PerformanceReviewRepository reviewRepository,
            EmployeeRepository employeeRepository) {
        this.reviewRepository = reviewRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<PerformanceReviewResponse> getAll() {
        return reviewRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PerformanceReviewResponse create(PerformanceReviewRequest request) {
        if (request.goalsCompleted() > request.goalsTotal()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Completed goals cannot exceed total goals"
            );
        }

        if (reviewRepository.existsByEmployeeIdAndReviewCycle(
                request.employeeId(), request.reviewCycle().trim())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A review already exists for this employee and review cycle"
            );
        }

        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Employee not found"
                ));

        PerformanceReview review = new PerformanceReview();
        review.setEmployee(employee);
        review.setReviewCycle(request.reviewCycle().trim());
        review.setRating(request.rating());
        review.setGoalsTotal(request.goalsTotal());
        review.setGoalsCompleted(request.goalsCompleted());
        review.setFeedback(request.feedback());
        review.setStatus("DRAFT");

        return toResponse(reviewRepository.save(review));
    }

    @Transactional
    public PerformanceReviewResponse updateStatus(Long id, String status) {
        if (status == null ||
                !List.of("DRAFT", "IN_REVIEW", "COMPLETED").contains(status)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Status must be DRAFT, IN_REVIEW, or COMPLETED"
            );
        }

        PerformanceReview review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Performance review not found"
                ));

        review.setStatus(status);
        return toResponse(reviewRepository.save(review));
    }

    private PerformanceReviewResponse toResponse(PerformanceReview review) {
        Employee employee = review.getEmployee();

        return new PerformanceReviewResponse(
                review.getId(),
                employee.getId(),
                employee.getName(),
                employee.getDepartment(),
                employee.getJobTitle(),
                review.getReviewCycle(),
                review.getRating(),
                review.getGoalsTotal(),
                review.getGoalsCompleted(),
                review.getFeedback(),
                review.getStatus(),
                review.getCreatedAt()
        );
    }
}
