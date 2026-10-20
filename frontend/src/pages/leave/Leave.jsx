import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    CalendarDays,
    Search,
    Plus,
    CheckCircle2,
    Clock3,
    XCircle,
    X,
    RefreshCw,
} from 'lucide-react'
import { employeeApi, leaveApi } from '../../services/api'

const emptyForm = {
    employeeId: '',
    type: 'CASUAL',
    from: '',
    to: '',
    reason: '',
}

function LeaveStatus({ status }) {
    const label = {
        PENDING: 'Pending',
        APPROVED: 'Approved',
        REJECTED: 'Rejected',
    }[status?.toUpperCase()] || status

    return (
        <span className={`hr-status ${label.toLowerCase()}`}>
            <span />
            {label}
        </span>
    )
}

function countLeaveDays(from, to) {
    if (!from || !to || to < from) return 0

    const start = new Date(`${from}T12:00:00`)
    const end = new Date(`${to}T12:00:00`)

    return Math.floor((end - start) / 86400000) + 1
}

function formatLeaveType(type) {
    if (!type) return '—'

    return type
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

function formatDate(date) {
    if (!date) return '—'

    return date
}

function getErrorMessage(error) {
    return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Something went wrong. Please try again.'
    )
}

export default function Leave() {
    const [requests, setRequests] = useState([])
    const [employees, setEmployees] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All Requests')
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState('')
    const [message, setMessage] = useState('')
    const [pageError, setPageError] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [updatingId, setUpdatingId] = useState(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        setPageError('')

        try {
            const [leaveResponse, employeeResponse] = await Promise.all([
                leaveApi.getAll(),
                employeeApi.getAll(),
            ])

            const employeeList = Array.isArray(employeeResponse.data)
                ? employeeResponse.data
                : []

            const employeeMap = new Map(
                employeeList.map((employee) => [
                    Number(employee.id),
                    employee,
                ]),
            )

            const leaveList = Array.isArray(leaveResponse.data)
                ? leaveResponse.data
                : []

            const mappedRequests = leaveList.map((leave) => {
                const employee =
                    leave.employee ||
                    employeeMap.get(Number(leave.employeeId))

                return {
                    id: leave.id,
                    employeeId: employee?.id ?? leave.employeeId,
                    name: employee?.name || 'Unknown employee',
                    department: employee?.department || '—',
                    type: leave.leaveType,
                    from: leave.startDate,
                    to: leave.endDate,
                    days: countLeaveDays(leave.startDate, leave.endDate),
                    reason: leave.reason || '',
                    status: leave.status?.toUpperCase() || 'PENDING',
                    submitted: leave.submittedDate || leave.createdAt || '',
                }
            })

            setEmployees(employeeList)
            setRequests(mappedRequests)
        } catch (error) {
            setPageError(
                `Could not load leave data. ${getErrorMessage(error)}`
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const filteredRequests = useMemo(() => {
        const query = search.trim().toLowerCase()

        return requests.filter((request) => {
            const matchesSearch =
                !query ||
                request.name.toLowerCase().includes(query) ||
                request.department.toLowerCase().includes(query) ||
                formatLeaveType(request.type).toLowerCase().includes(query)

            const matchesStatus =
                statusFilter === 'All Requests' ||
                request.status === statusFilter.toUpperCase()

            return matchesSearch && matchesStatus
        })
    }, [requests, search, statusFilter])

    const counts = useMemo(
        () => ({
            total: requests.length,
            pending: requests.filter(
                (request) => request.status === 'PENDING'
            ).length,
            approved: requests.filter(
                (request) => request.status === 'APPROVED'
            ).length,
            rejected: requests.filter(
                (request) => request.status === 'REJECTED'
            ).length,
        }),
        [requests]
    )

    function handleFormChange(event) {
        const { name, value } = event.target

        setForm((current) => ({
            ...current,
            [name]: value,
        }))
    }

    async function updateRequestStatus(id, status) {
        setMessage('')
        setPageError('')
        setUpdatingId(id)

        try {
            await leaveApi.updateStatus(id, status)

            setMessage(
                `Leave request ${status.toLowerCase()} successfully.`
            )

            await loadData()
        } catch (error) {
            setPageError(
                `Could not update the leave request. ${getErrorMessage(error)}`
            )
        } finally {
            setUpdatingId(null)
        }
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setFormError('')
        setMessage('')
        setPageError('')

        if (
            !form.employeeId ||
            !form.from ||
            !form.to ||
            !form.reason.trim()
        ) {
            setFormError('Please complete all required fields.')
            return
        }

        if (form.to < form.from) {
            setFormError('The end date cannot be before the start date.')
            return
        }

        const selectedEmployee = employees.find(
            (employee) => Number(employee.id) === Number(form.employeeId)
        )

        if (!selectedEmployee) {
            setFormError('Please select a valid employee.')
            return
        }

        const duplicatePendingRequest = requests.some(
            (request) =>
                Number(request.employeeId) === Number(form.employeeId) &&
                request.from === form.from &&
                request.to === form.to &&
                request.status === 'PENDING'
        )

        if (duplicatePendingRequest) {
            setFormError(
                'A pending request already exists for this employee and date range.'
            )
            return
        }

        setSubmitting(true)

        try {
            await leaveApi.create(Number(form.employeeId), {
                leaveType: form.type,
                startDate: form.from,
                endDate: form.to,
                reason: form.reason.trim(),
            })

            setForm(emptyForm)
            setShowForm(false)
            setStatusFilter('All Requests')
            setSearch('')
            setMessage('Leave request submitted successfully.')

            await loadData()
        } catch (error) {
            setFormError(
                `Could not submit the request. ${getErrorMessage(error)}`
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section className="hr-page">
            <div className="hr-page-heading">
                <div>
                    <div className="hr-breadcrumb">
                        Workspace / Leave Management
                    </div>
                    <h1>Leave Management</h1>
                    <p>
                        Review leave requests and manage employee time off.
                    </p>
                </div>

                <button
                    className="hr-button hr-button-primary"
                    onClick={() => {
                        setForm(emptyForm)
                        setFormError('')
                        setMessage('')
                        setShowForm(true)
                    }}
                    disabled={employees.length === 0}
                >
                    <Plus size={17} /> New Leave Request
                </button>
            </div>

            <div className="hr-summary-grid">
                <div className="hr-summary-card">
                    <div className="hr-summary-icon purple">
                        <CalendarDays size={20} />
                    </div>
                    <span>Total requests</span>
                    <strong>{counts.total}</strong>
                    <small>All recorded requests</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon orange">
                        <Clock3 size={20} />
                    </div>
                    <span>Pending review</span>
                    <strong>{counts.pending}</strong>
                    <small>Awaiting a decision</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon green">
                        <CheckCircle2 size={20} />
                    </div>
                    <span>Approved</span>
                    <strong>{counts.approved}</strong>
                    <small>Approved requests</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon red">
                        <XCircle size={20} />
                    </div>
                    <span>Rejected</span>
                    <strong>{counts.rejected}</strong>
                    <small>Rejected requests</small>
                </div>
            </div>

            <div className="hr-panel">
                <div className="hr-panel-heading">
                    <div>
                        <h2>Leave requests</h2>
                        <p>
                            Review employee requests and update their status.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="hr-button"
                        onClick={loadData}
                        disabled={loading}
                        title="Refresh leave requests"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="hr-toolbar">
                    <label className="hr-search">
                        <Search size={17} />
                        <input
                            type="search"
                            placeholder="Search employee, department, leave type..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>

                    <select
                        className="hr-select"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                        aria-label="Filter leave request status"
                    >
                        <option>All Requests</option>
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Rejected</option>
                    </select>
                </div>

                {message && (
                    <p className="hr-success-message" role="status">
                        {message}
                    </p>
                )}

                {pageError && (
                    <p className="employee-form-error" role="alert">
                        {pageError}
                    </p>
                )}

                {loading ? (
                    <div className="hr-empty">Loading leave requests...</div>
                ) : (
                    <>
                        <div className="hr-table-wrap">
                            <table className="hr-table">
                                <thead>
                                <tr>
                                    <th>EMPLOYEE</th>
                                    <th>LEAVE TYPE</th>
                                    <th>DATES</th>
                                    <th>DAYS</th>
                                    <th>REASON</th>
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
                                </tr>
                                </thead>

                                <tbody>
                                {filteredRequests.map((request) => (
                                    <tr key={request.id}>
                                        <td>
                                            <div className="hr-person">
                                                <div className="hr-avatar">
                                                    {request.name
                                                        .split(' ')
                                                        .map((part) => part[0])
                                                        .join('')
                                                        .slice(0, 2)}
                                                </div>

                                                <div className="hr-person-text">
                                                    <strong>
                                                        {request.name}
                                                    </strong>
                                                    <small>
                                                        {request.department}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {formatLeaveType(request.type)}
                                        </td>

                                        <td>
                                            <div className="hr-date-range">
                                                <strong>
                                                    {formatDate(request.from)}
                                                </strong>
                                                <small>
                                                    to {formatDate(request.to)}
                                                </small>
                                            </div>
                                        </td>

                                        <td>
                                            <strong>{request.days}</strong>
                                        </td>

                                        <td className="hr-reason-cell">
                                            {request.reason}
                                        </td>

                                        <td>
                                            <LeaveStatus
                                                status={request.status}
                                            />
                                        </td>

                                        <td>
                                            {request.status === 'PENDING' ? (
                                                <div className="hr-decision-actions">
                                                    <button
                                                        className="hr-approve-button"
                                                        title="Approve request"
                                                        aria-label={`Approve ${request.name}'s leave`}
                                                        disabled={
                                                            updatingId === request.id
                                                        }
                                                        onClick={() =>
                                                            updateRequestStatus(
                                                                request.id,
                                                                'APPROVED'
                                                            )
                                                        }
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>

                                                    <button
                                                        className="hr-reject-button"
                                                        title="Reject request"
                                                        aria-label={`Reject ${request.name}'s leave`}
                                                        disabled={
                                                            updatingId === request.id
                                                        }
                                                        onClick={() =>
                                                            updateRequestStatus(
                                                                request.id,
                                                                'REJECTED'
                                                            )
                                                        }
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="hr-reviewed-label">
                                                        Reviewed
                                                    </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {filteredRequests.length === 0 && (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="hr-empty">
                                                {requests.length === 0
                                                    ? 'No leave requests have been recorded yet.'
                                                    : 'No leave requests match your filters.'}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="hr-table-footer">
                            Showing {filteredRequests.length} request
                            {filteredRequests.length === 1 ? '' : 's'}
                        </div>
                    </>
                )}
            </div>

            {showForm && (
                <div
                    className="employee-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowForm(false)
                        }
                    }}
                >
                    <div
                        className="employee-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="leave-form-title"
                    >
                        <div className="employee-modal-header">
                            <div>
                                <h2 id="leave-form-title">
                                    New leave request
                                </h2>
                                <p>
                                    Enter the employee and leave details.
                                </p>
                            </div>

                            <button
                                className="employee-modal-close"
                                onClick={() => setShowForm(false)}
                                aria-label="Close form"
                                type="button"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="employee-form-grid">
                                <label>
                                    Employee *
                                    <select
                                        name="employeeId"
                                        value={form.employeeId}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">
                                            Select an employee
                                        </option>

                                        {employees.map((employee) => (
                                            <option
                                                key={employee.id}
                                                value={employee.id}
                                            >
                                                {employee.name} — {employee.department}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    Leave type *
                                    <select
                                        name="type"
                                        value={form.type}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="CASUAL">
                                            Casual Leave
                                        </option>
                                        <option value="SICK">
                                            Sick Leave
                                        </option>
                                        <option value="ANNUAL">
                                            Annual Leave
                                        </option>
                                        <option value="UNPAID">
                                            Unpaid Leave
                                        </option>
                                        <option value="WORK_FROM_HOME">
                                            Work From Home
                                        </option>
                                    </select>
                                </label>

                                <label>
                                    Start date *
                                    <input
                                        type="date"
                                        name="from"
                                        value={form.from}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </label>

                                <label>
                                    End date *
                                    <input
                                        type="date"
                                        name="to"
                                        value={form.to}
                                        min={form.from || undefined}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </label>

                                <label>
                                    Total days
                                    <input
                                        value={
                                            countLeaveDays(form.from, form.to) || ''
                                        }
                                        readOnly
                                        placeholder="Calculated automatically"
                                    />
                                </label>

                                <label className="hr-full-width">
                                    Reason for leave *
                                    <textarea
                                        name="reason"
                                        value={form.reason}
                                        onChange={handleFormChange}
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Enter the reason for this request"
                                        required
                                    />
                                </label>
                            </div>

                            {formError && (
                                <p
                                    className="employee-form-error"
                                    role="alert"
                                >
                                    {formError}
                                </p>
                            )}

                            <div className="employee-modal-footer">
                                <button
                                    type="button"
                                    className="employee-secondary-button"
                                    onClick={() => setShowForm(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="employee-primary-button"
                                    disabled={submitting}
                                >
                                    {submitting
                                        ? 'Submitting...'
                                        : 'Submit request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}