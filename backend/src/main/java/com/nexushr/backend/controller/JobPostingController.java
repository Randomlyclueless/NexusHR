
package com.nexushr.backend.controller;

import com.nexushr.backend.entity.JobPosting;
import com.nexushr.backend.entity.JobStatus;
import com.nexushr.backend.service.JobPostingService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recruitment/jobs")
public class JobPostingController {

    private final JobPostingService service;

    public JobPostingController(JobPostingService service) {
        this.service = service;
    }

    @GetMapping
    public List<JobPosting> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return service.getAll(status, search);
    }

    @GetMapping("/{id}")
    public JobPosting getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JobPosting create(@RequestBody JobPosting job) {
        return service.create(job);
    }

    @PutMapping("/{id}")
    public JobPosting update(
            @PathVariable Long id,
            @RequestBody JobPosting job) {
        return service.update(id, job);
    }

    @PatchMapping("/{id}/status")
    public JobPosting updateStatus(
            @PathVariable Long id,
            @RequestParam JobStatus status) {
        return service.updateStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}