
package com.nexushr.backend.repository;

import com.nexushr.backend.entity.JobPosting;
import com.nexushr.backend.entity.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobPostingRepository
        extends JpaRepository<JobPosting, Long> {

    List<JobPosting> findByStatusOrderByCreatedAtDesc(
            JobStatus status
    );

    List<JobPosting> findByTitleContainingIgnoreCaseOrDepartmentContainingIgnoreCase(
            String title,
            String department
    );
}
