
package com.nexushr.backend.controller;

import com.nexushr.backend.dto.PerformanceReviewRequest;
import com.nexushr.backend.dto.PerformanceReviewResponse;
import com.nexushr.backend.service.PerformanceReviewService;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/performance")
public class PerformanceReviewController {

    private final PerformanceReviewService reviewService;

    public PerformanceReviewController(
            PerformanceReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<PerformanceReviewResponse> getAll() {
        return reviewService.getAll();
    }

    @PostMapping
    public PerformanceReviewResponse create(
            @Valid @RequestBody PerformanceReviewRequest request) {
        return reviewService.create(request);
    }

    @PatchMapping("/{id}/status")
    public PerformanceReviewResponse updateStatus(
            @PathVariable Long id,
            @RequestBody StatusRequest request) {
        return reviewService.updateStatus(id, request.status());
    }

    public record StatusRequest(String status) {}
}
