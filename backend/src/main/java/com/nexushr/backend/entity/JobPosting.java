package com.nexushr.backend.entity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_postings")
public class JobPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String title;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String department;

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String location;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, length = 50)
    private String employmentType;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Size(max = 100)
    private String salaryRange;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobStatus status = JobStatus.OPEN;

    @NotNull
    @Column(nullable = false)
    private LocalDate postedDate = LocalDate.now();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public JobPosting() {}

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (postedDate == null) {
            postedDate = LocalDate.now();
        }
        if (status == null) {
            status = JobStatus.OPEN;
        }
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDepartment() { return department; }
    public String getLocation() { return location; }
    public String getEmploymentType() { return employmentType; }
    public String getDescription() { return description; }
    public String getRequirements() { return requirements; }
    public String getSalaryRange() { return salaryRange; }
    public JobStatus getStatus() { return status; }
    public LocalDate getPostedDate() { return postedDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setDepartment(String department) { this.department = department; }
    public void setLocation(String location) { this.location = location; }
    public void setEmploymentType(String employmentType) {
        this.employmentType = employmentType;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }
    public void setSalaryRange(String salaryRange) {
        this.salaryRange = salaryRange;
    }
    public void setStatus(JobStatus status) { this.status = status; }
    public void setPostedDate(LocalDate postedDate) {
        this.postedDate = postedDate;
    }
}