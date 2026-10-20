
import axios from 'axios'

const API_URL = 'http://localhost:8080/api'
const PAYROLL_URL = `${API_URL}/payroll`

export async function getPayrollRecords(employeeId) {
    const response = await axios.get(PAYROLL_URL, {
        params: employeeId ? { employeeId } : {},
    })
    return response.data
}

export async function getPayrollRecord(id) {
    const response = await axios.get(`${PAYROLL_URL}/${id}`)
    return response.data
}

export async function createPayrollRecord(payload) {
    const response = await axios.post(PAYROLL_URL, payload)
    return response.data
}

export async function updatePayrollStatus(id, status) {
    const response = await axios.patch(
        `${PAYROLL_URL}/${id}/status`,
        { status }
    )
    return response.data
}

export async function getPayrollEmployees() {
    const response = await axios.get(`${API_URL}/employees`)
    return Array.isArray(response.data) ? response.data : [response.data]
}
