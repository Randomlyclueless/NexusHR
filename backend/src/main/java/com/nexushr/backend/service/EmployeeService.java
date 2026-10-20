package com.nexushr.backend.service;

import com.nexushr.backend.entity.Employee;
import com.nexushr.backend.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Employee not found with ID: " + id
                        ));
    }

    public Employee createEmployee(Employee employee) {
        if (employeeRepository.existsByEmail(employee.getEmail())) {
            throw new IllegalArgumentException(
                    "An employee with this email already exists"
            );
        }

        // Let the database generate the ID.
        employee.setId(null);

        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, Employee updatedEmployee) {
        Employee existingEmployee = getEmployeeById(id);

        employeeRepository.findByEmail(updatedEmployee.getEmail())
                .filter(employee -> !employee.getId().equals(id))
                .ifPresent(employee -> {
                    throw new IllegalArgumentException(
                            "Another employee already uses this email"
                    );
                });

        existingEmployee.setName(updatedEmployee.getName());
        existingEmployee.setEmail(updatedEmployee.getEmail());
        existingEmployee.setDepartment(updatedEmployee.getDepartment());
        existingEmployee.setJobTitle(updatedEmployee.getJobTitle());
        existingEmployee.setStatus(updatedEmployee.getStatus());
        existingEmployee.setPhone(updatedEmployee.getPhone());
        existingEmployee.setJoiningDate(updatedEmployee.getJoiningDate());

        return employeeRepository.save(existingEmployee);
    }

    public void deleteEmployee(Long id) {
        Employee employee = getEmployeeById(id);
        employeeRepository.delete(employee);
    }
}
