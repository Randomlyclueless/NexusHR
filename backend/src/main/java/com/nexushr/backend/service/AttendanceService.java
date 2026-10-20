
package com.nexushr.backend.service;

import com.nexushr.backend.dto.BulkAttendanceRequest;
import com.nexushr.backend.entity.Attendance;
import com.nexushr.backend.entity.AttendanceStatus;
import com.nexushr.backend.entity.Employee;
import com.nexushr.backend.repository.AttendanceRepository;
import com.nexushr.backend.repository.EmployeeRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            EmployeeRepository employeeRepository) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
    }

    public List<Attendance> getAttendanceByDate(LocalDate date) {
        return attendanceRepository.findByDate(date);
    }

    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    @Transactional
    public Attendance updateAttendance(Long id, AttendanceStatus status) {

        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Attendance record not found"));

        applyStatus(attendance, status);
        return attendanceRepository.save(attendance);
    }

    @Transactional
    public Attendance createAttendance(
            Long employeeId,
            LocalDate date,
            AttendanceStatus status) {

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Employee not found"));

        if (attendanceRepository.existsByEmployeeIdAndDate(employeeId, date)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Attendance already exists for this employee and date");
        }

        Attendance attendance = new Attendance();
        attendance.setEmployee(employee);
        attendance.setDate(date);
        applyStatus(attendance, status);

        return attendanceRepository.save(attendance);
    }

    @Transactional
    public List<Attendance> bulkMarkAttendance(BulkAttendanceRequest request) {

        if (request == null
                || request.getDate() == null
                || request.getStatus() == null
                || request.getEmployeeIds() == null
                || request.getEmployeeIds().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Date, status, and at least one employee ID are required");
        }

        LocalDate date = request.getDate();
        AttendanceStatus status = request.getStatus();

        List<Attendance> results = new ArrayList<>();

        for (Long employeeId : request.getEmployeeIds()) {

            if (employeeId == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Employee IDs cannot be null");
            }

            Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Employee not found: " + employeeId));

            Attendance attendance = attendanceRepository
                    .findByEmployeeIdAndDate(employeeId, date)
                    .orElseGet(() -> {
                        Attendance newAttendance = new Attendance();
                        newAttendance.setEmployee(employee);
                        newAttendance.setDate(date);
                        return newAttendance;
                    });

            applyStatus(attendance, status);
            results.add(attendanceRepository.save(attendance));
        }

        return results;
    }

    private void applyStatus(
            Attendance attendance,
            AttendanceStatus status) {

        if (status == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Attendance status is required");
        }

        attendance.setStatus(status);

        if (status == AttendanceStatus.PRESENT
                || status == AttendanceStatus.LATE) {

            if (attendance.getCheckIn() == null) {
                attendance.setCheckIn(
                        LocalTime.now().withSecond(0).withNano(0));
            }

        } else {
            attendance.setCheckIn(null);
            attendance.setCheckOut(null);
        }
    }
}
