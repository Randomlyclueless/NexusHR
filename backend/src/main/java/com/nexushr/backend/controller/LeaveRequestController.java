
package com.nexushr.backend.controller;

import com.nexushr.backend.entity.LeaveRequest;
import com.nexushr.backend.entity.LeaveStatus;
import com.nexushr.backend.service.LeaveRequestService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = "http://localhost:5174")
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    public LeaveRequestController(
            LeaveRequestService leaveRequestService) {
        this.leaveRequestService = leaveRequestService;
    }

    // Get all leave requests, optionally filtered by employee
    @GetMapping
    public List<LeaveRequest> getAllRequests(
            @RequestParam(required = false) Long employeeId) {

        if (employeeId != null) {
            return leaveRequestService.getRequestsByEmployee(employeeId);
        }

        return leaveRequestService.getAllRequests();
    }

    // Apply for leave
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LeaveRequest applyForLeave(
            @RequestParam Long employeeId,
            @RequestBody LeaveRequest request) {

        return leaveRequestService.applyForLeave(employeeId, request);
    }

    // Approve or reject a leave request
    @PatchMapping("/{id}/status")
    public LeaveRequest updateStatus(
            @PathVariable Long id,
            @RequestParam LeaveStatus status) {

        return leaveRequestService.updateStatus(id, status);
    }
}
