
package com.nexushr.backend.controller;

import com.nexushr.backend.dto.BulkAttendanceRequest;
import com.nexushr.backend.entity.Attendance;
import com.nexushr.backend.entity.AttendanceStatus;
import com.nexushr.backend.service.AttendanceService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    public List<Attendance> getAttendance(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date) {

        if (date != null) {
            return attendanceService.getAttendanceByDate(date);
        }

        return attendanceService.getAllAttendance();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Attendance createAttendance(
            @RequestParam Long employeeId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date,
            @RequestParam AttendanceStatus status) {

        return attendanceService.createAttendance(
                employeeId, date, status);
    }

    @PostMapping("/bulk")
    public List<Attendance> bulkMark(
            @RequestBody BulkAttendanceRequest request) {

        return attendanceService.bulkMarkAttendance(request);
    }

    @PatchMapping("/{id}/status")
    public Attendance updateStatus(
            @PathVariable Long id,
            @RequestParam AttendanceStatus status) {

        return attendanceService.updateAttendance(id, status);
    }
}
