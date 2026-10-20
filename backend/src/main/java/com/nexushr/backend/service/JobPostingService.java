package com.nexushr.backend.service;

import com.nexushr.backend.entity.JobPosting;
import com.nexushr.backend.entity.JobStatus;
import com.nexushr.backend.repository.JobPostingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class JobPostingService {

    private final JobPostingRepository repository;

    public JobPostingService(JobPostingRepository repository) {
        this.repository = repository;
    }

    public List<JobPosting> getAll(String status, String search) {
        List<JobPosting> jobs;

        if (status != null && !status.isBlank()) {
            JobStatus jobStatus;
            try {
                jobStatus = JobStatus.valueOf(
                        status.trim().toUpperCase()
                );
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Status must be OPEN or CLOSED"
                );
            }

            jobs = repository.findByStatusOrderByCreatedAtDesc(jobStatus);
        } else {
            jobs = repository.findAll();
        }

        if (search == null || search.isBlank()) {
            return jobs;
        }

        String term = search.trim().toLowerCase();

        return jobs.stream()
                .filter(job ->
                        job.getTitle().toLowerCase().contains(term)
                                || job.getDepartment().toLowerCase().contains(term)
                                || job.getLocation().toLowerCase().contains(term)
                )
                .toList();
    }

    public JobPosting getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Job posting not found"
                ));
    }

    public JobPosting create(JobPosting job) {
        job.setId(null);
        validate(job);

        if (job.getStatus() == null) {
            job.setStatus(JobStatus.OPEN);
        }

        return repository.save(job);
    }

    @Transactional
    public JobPosting update(Long id, JobPosting input) {
        JobPosting existing = getById(id);

        validate(input);

        existing.setTitle(input.getTitle());
        existing.setDepartment(input.getDepartment());
        existing.setLocation(input.getLocation());
        existing.setEmploymentType(input.getEmploymentType());
        existing.setDescription(input.getDescription());
        existing.setRequirements(input.getRequirements());
        existing.setSalaryRange(input.getSalaryRange());

        return repository.save(existing);
    }

    @Transactional
    public JobPosting updateStatus(Long id, JobStatus status) {
        JobPosting job = getById(id);
        job.setStatus(status);
        return repository.save(job);
    }

    public void delete(Long id) {
        JobPosting job = getById(id);
        repository.delete(job);
    }

    private void validate(JobPosting job) {
        if (job.getTitle() == null || job.getTitle().isBlank()
                || job.getDepartment() == null || job.getDepartment().isBlank()
                || job.getLocation() == null || job.getLocation().isBlank()
                || job.getEmploymentType() == null
                || job.getEmploymentType().isBlank()
                || job.getDescription() == null
                || job.getDescription().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Title, department, location, employment type, and description are required"
            );
        }
    }
}