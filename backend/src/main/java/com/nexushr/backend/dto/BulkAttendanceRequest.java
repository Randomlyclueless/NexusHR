
package com.nexushr.backend.dto;

import com.nexushr.backend.entity.AttendanceStatus;
import java.time.LocalDate;
import java.util.List;

public class BulkAttendanceRequest {

    private LocalDate date;
    private AttendanceStatus status;
    private List<Long> employeeIds;

    public BulkAttendanceRequest() {
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public AttendanceStatus getStatus() {
        return status;
    }

    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public List<Long> getEmployeeIds() {
        return employeeIds;
    }

    public void setEmployeeIds(List<Long> employeeIds) {
        this.employeeIds = employeeIds;
    }
}
