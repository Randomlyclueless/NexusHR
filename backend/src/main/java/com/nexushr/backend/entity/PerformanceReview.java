
package com.nexushr.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "performance_reviews",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_performance_employee_cycle",
                columnNames = {"employee_id", "review_cycle"}
        )
)
public class PerformanceReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "review_cycle", nullable = false, length = 50)
    private String reviewCycle;

    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal rating;

    @Column(name = "goals_total", nullable = false)
    private Integer goalsTotal;

    @Column(name = "goals_completed", nullable = false)
    private Integer goalsCompleted;

    @Column(length = 3000)
    private String feedback;

    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public PerformanceReview() {}

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public Employee getEmployee() { return employee; }
    public String getReviewCycle() { return reviewCycle; }
    public BigDecimal getRating() { return rating; }
    public Integer getGoalsTotal() { return goalsTotal; }
    public Integer getGoalsCompleted() { return goalsCompleted; }
    public String getFeedback() { return feedback; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setEmployee(Employee employee) { this.employee = employee; }
    public void setReviewCycle(String reviewCycle) { this.reviewCycle = reviewCycle; }
    public void setRating(BigDecimal rating) { this.rating = rating; }
    public void setGoalsTotal(Integer goalsTotal) { this.goalsTotal = goalsTotal; }
    public void setGoalsCompleted(Integer goalsCompleted) { this.goalsCompleted = goalsCompleted; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public void setStatus(String status) { this.status = status; }
}
