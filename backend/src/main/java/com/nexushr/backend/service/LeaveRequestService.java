
package com.nexushr.backend.service;

import com.nexushr.backend.entity.Employee;
import com.nexushr.backend.entity.LeaveRequest;
import com.nexushr.backend.entity.LeaveStatus;
import com.nexushr.backend.repository.EmployeeRepository;
import com.nexushr.backend.repository.LeaveRequestRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;

    public LeaveRequestService(
            LeaveRequestRepository leaveRequestRepository,
            EmployeeRepository employeeRepository) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeRepository = employeeRepository;
    }

    public List<LeaveRequest> getAllRequests() {
        return leaveRequestRepository.findAll();
    }

    public List<LeaveRequest> getRequestsByEmployee(Long employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId);
    }

    public LeaveRequest applyForLeave(
            Long employeeId, LeaveRequest request) {

        if (request.getStartDate() == null
                || request.getEndDate() == null
                || request.getStartDate().isAfter(request.getEndDate())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "End date must be on or after start date");
        }

        if (request.getLeaveType() == null
                || request.getLeaveType().isBlank()
                || request.getReason() == null
                || request.getReason().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Leave type and reason are required");
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Employee not found"));

        request.setId(null);
        request.setEmployee(employee);
        request.setStatus(LeaveStatus.PENDING);

        return leaveRequestRepository.save(request);
    }

    public LeaveRequest updateStatus(Long id, LeaveStatus status) {
        LeaveRequest request = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Leave request not found"));

        if (status == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Status is required");
        }

        request.setStatus(status);
        return leaveRequestRepository.save(request);
    }
}
