
import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

export const employeeApi = {
    getAll: () => api.get('/employees'),

    getById: (id) => api.get(`/employees/${id}`),

    create: (employee) => api.post('/employees', employee),

    update: (id, employee) => api.put(`/employees/${id}`, employee),

    delete: (id) => api.delete(`/employees/${id}`),
}

export const attendanceApi = {
    getAll: (date) =>
        api.get('/attendance', {
            params: date ? { date } : {},
        }),

    create: (employeeId, date, status) =>
        api.post('/attendance', null, {
            params: { employeeId, date, status },
        }),

    updateStatus: (id, status) =>
        api.patch(`/attendance/${id}/status`, null, {
            params: { status },
        }),

    // Mark multiple employees' attendance for a selected date.
    // Requires POST /api/attendance/bulk in the Spring Boot backend.
    bulkMark: (date, status, employeeIds) =>
        api.post('/attendance/bulk', {
            date,
            status,
            employeeIds,
        }),
}

export const leaveApi = {
    getAll: () => api.get('/leaves'),

    create: (employeeId, leaveRequest) =>
        api.post('/leaves', leaveRequest, {
            params: { employeeId },
        }),

    updateStatus: (id, status) =>
        api.patch(`/leaves/${id}/status`, null, {
            params: { status },
        }),
}

export const recruitmentApi = {
    getAll: (params = {}) =>
        api.get('/recruitment/jobs', { params }),

    getById: (id) =>
        api.get(`/recruitment/jobs/${id}`),

    create: (job) =>
        api.post('/recruitment/jobs', job),

    update: (id, job) =>
        api.put(`/recruitment/jobs/${id}`, job),

    updateStatus: (id, status) =>
        api.patch(`/recruitment/jobs/${id}/status`, null, {
            params: { status },
        }),

    delete: (id) =>
        api.delete(`/recruitment/jobs/${id}`),
}

export const aiInsightsApi = {
    getHealth: () => api.get('/ai/health'),
}

export default api
