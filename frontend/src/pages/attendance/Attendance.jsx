
import { useCallback, useEffect, useMemo, useState } from 'react'
import api, { attendanceApi } from '../../services/api.js'
import {
    CalendarDays,
    Clock3,
    Search,
    Download,
    CheckCircle2,
    XCircle,
    Timer,
    Users,
    UserX,
    RefreshCw,
} from 'lucide-react'

const STATUSES = ['Present', 'Late', 'Absent', 'On Leave']
const NOT_MARKED = 'Not Marked'
const STATUS_TABS = ['All', NOT_MARKED, ...STATUSES]

function getLocalDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function formatStatus(status) {
    return String(status ?? '')
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

function toBackendStatus(status) {
    return status.toUpperCase().replaceAll(' ', '_')
}

function readList(response) {
    const data = response?.data

    if (Array.isArray(data)) return data
    if (Array.isArray(data?.content)) return data.content
    if (Array.isArray(data?.data)) return data.data

    return []
}

function AttendanceStatus({ status }) {
    return (
        <span
            className={`hr-status ${status.toLowerCase().replaceAll(' ', '-')}`}
        >
            <span />
            {status}
        </span>
    )
}

const chipStyle = (active) => ({
    padding: '7px 12px',
    borderRadius: 999,
    border: '1px solid #e2e8f0',
    background: active ? '#6654d9' : 'var(--hr-card, #fff)',
    color: active ? '#fff' : 'inherit',
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
})

export default function Attendance() {
    const [employees, setEmployees] = useState([])
    const [records, setRecords] = useState([])
    const [date, setDate] = useState(getLocalDate())
    const [search, setSearch] = useState('')
    const [department, setDepartment] = useState('All')
    const [statusTab, setStatusTab] = useState('All')
    const [selected, setSelected] = useState(new Set())
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [apiError, setApiError] = useState('')

    const load = useCallback(async () => {
        setLoading(true)
        setApiError('')

        try {
            const [employeeResponse, attendanceResponse] =
                await Promise.all([
                    api.get('/employees'),
                    attendanceApi.getAll(date),
                ])

            setEmployees(readList(employeeResponse))
            setRecords(readList(attendanceResponse))
        } catch (error) {
            console.error('Failed to load attendance:', error)

            setApiError(
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'Could not load attendance. Check that the backend is running.'
            )
        } finally {
            setLoading(false)
        }
    }, [date])

    useEffect(() => {
        load()
    }, [load])

    // Display every employee, including employees not yet marked for this date.
    const rows = useMemo(() => {
        const recordByEmployee = new Map(
            records.map((record) => [
                record.employee?.id ?? record.employeeId,
                record,
            ])
        )

        return employees.map((employee) => {
            const record = recordByEmployee.get(employee.id)

            return {
                employeeId: employee.id,
                attendanceId: record?.id ?? null,
                name: employee.name ?? 'Unnamed',
                department: employee.department || 'Unassigned',
                checkIn: record?.checkIn
                    ? record.checkIn.slice(0, 5)
                    : '—',
                checkOut: record?.checkOut
                    ? record.checkOut.slice(0, 5)
                    : '—',
                status: record
                    ? formatStatus(record.status)
                    : NOT_MARKED,
            }
        })
    }, [employees, records])

    const departments = useMemo(() => {
        const counts = {}

        rows.forEach((row) => {
            counts[row.department] = (counts[row.department] || 0) + 1
        })

        return Object.entries(counts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, count]) => ({ name, count }))
    }, [rows])

    const scopedRows = useMemo(() => {
        const query = search.trim().toLowerCase()

        return rows.filter((row) => {
            const matchesDepartment =
                department === 'All' || row.department === department

            const matchesSearch =
                !query ||
                row.name.toLowerCase().includes(query) ||
                row.department.toLowerCase().includes(query)

            return matchesDepartment && matchesSearch
        })
    }, [rows, department, search])

    const visibleRows = useMemo(() => {
        return statusTab === 'All'
            ? scopedRows
            : scopedRows.filter((row) => row.status === statusTab)
    }, [scopedRows, statusTab])

    const totals = useMemo(() => {
        const count = (status) =>
            rows.filter((row) => row.status === status).length

        return {
            total: rows.length,
            present: count('Present'),
            late: count('Late'),
            absent: count('Absent'),
            leave: count('On Leave'),
            unmarked: count(NOT_MARKED),
        }
    }, [rows])

    const tabCounts = useMemo(() => {
        const counts = { All: scopedRows.length }

        STATUS_TABS.slice(1).forEach((status) => {
            counts[status] = scopedRows.filter(
                (row) => row.status === status
            ).length
        })

        return counts
    }, [scopedRows])

    const selectedVisible = visibleRows.filter((row) =>
        selected.has(row.employeeId)
    )

    const allVisibleSelected =
        visibleRows.length > 0 &&
        visibleRows.every((row) => selected.has(row.employeeId))

    const unmarkedInScope = scopedRows.filter(
        (row) => row.status === NOT_MARKED
    )

    function toggleRow(employeeId) {
        setSelected((current) => {
            const next = new Set(current)

            if (next.has(employeeId)) {
                next.delete(employeeId)
            } else {
                next.add(employeeId)
            }

            return next
        })
    }

    function toggleAllVisible() {
        setSelected((current) => {
            const next = new Set(current)

            if (allVisibleSelected) {
                visibleRows.forEach((row) =>
                    next.delete(row.employeeId)
                )
            } else {
                visibleRows.forEach((row) =>
                    next.add(row.employeeId)
                )
            }

            return next
        })
    }

    // Requires attendanceApi.bulkMark(date, status, employeeIds)
    // to be implemented in api.js and backed by a Spring Boot endpoint.
    async function markMany(employeeIds, status) {
        if (employeeIds.length === 0 || saving) return

        setSaving(true)
        setMessage('')
        setApiError('')

        try {
            await attendanceApi.bulkMark(
                date,
                toBackendStatus(status),
                employeeIds
            )

            await load()
            setSelected(new Set())

            setMessage(
                `Marked ${employeeIds.length} employee${
                    employeeIds.length === 1 ? '' : 's'
                } as "${status}".`
            )
        } catch (error) {
            console.error('Failed to update attendance:', error)

            setApiError(
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'Attendance update failed. Verify the backend bulk-mark endpoint.'
            )

            await load()
        } finally {
            setSaving(false)
        }
    }

    function exportCSV() {
        const headers = [
            'Employee ID',
            'Employee',
            'Department',
            'Date',
            'Check In',
            'Check Out',
            'Status',
        ]

        const csvRows = visibleRows.map((row) => [
            row.employeeId,
            row.name,
            row.department,
            date,
            row.checkIn,
            row.checkOut,
            row.status,
        ])

        const csv = [headers, ...csvRows]
            .map((row) =>
                row
                    .map(
                        (value) =>
                            `"${String(value ?? '').replaceAll('"', '""')}"`
                    )
                    .join(',')
            )
            .join('\n')

        const url = URL.createObjectURL(
            new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        )

        const link = document.createElement('a')
        link.href = url
        link.download = `nexushr-attendance-${date}.csv`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    return (
        <section className="hr-page">
            <div className="hr-page-heading">
                <div>
                    <div className="hr-breadcrumb">
                        Workspace / Attendance
                    </div>
                    <h1>Attendance Management</h1>
                    <p>
                        Filter by department, review attendance status, and
                        mark multiple employees together.
                    </p>
                </div>

                <button
                    type="button"
                    className="hr-button hr-button-secondary"
                    onClick={exportCSV}
                    disabled={loading || visibleRows.length === 0}
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            <div className="hr-summary-grid">
                <div className="hr-summary-card">
                    <div className="hr-summary-icon purple">
                        <Users size={20} />
                    </div>
                    <span>Total employees</span>
                    <strong>{totals.total}</strong>
                    <small>{totals.unmarked} not marked yet</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon green">
                        <CheckCircle2 size={20} />
                    </div>
                    <span>Present</span>
                    <strong>{totals.present}</strong>
                    <small>Marked present</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon orange">
                        <Timer size={20} />
                    </div>
                    <span>Late arrivals</span>
                    <strong>{totals.late}</strong>
                    <small>Marked late</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon red">
                        <XCircle size={20} />
                    </div>
                    <span>Absent / Leave</span>
                    <strong>{totals.absent + totals.leave}</strong>
                    <small>
                        {totals.absent} absent · {totals.leave} on leave
                    </small>
                </div>
            </div>

            <div className="hr-panel">
                <div className="hr-panel-heading">
                    <div>
                        <h2>Daily attendance</h2>
                        <p>
                            Choose a department or status to narrow down the
                            employee list.
                        </p>
                    </div>

                    <label className="hr-date-control">
                        <CalendarDays size={16} />
                        <input
                            type="date"
                            value={date}
                            onChange={(event) => {
                                setDate(event.target.value)
                                setSelected(new Set())
                                setMessage('')
                                setApiError('')
                            }}
                        />
                    </label>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 12,
                    }}
                >
                    <button
                        type="button"
                        style={chipStyle(department === 'All')}
                        onClick={() => {
                            setDepartment('All')
                            setSelected(new Set())
                        }}
                    >
                        All departments ({rows.length})
                    </button>

                    {departments.map((item) => (
                        <button
                            type="button"
                            key={item.name}
                            style={chipStyle(department === item.name)}
                            onClick={() => {
                                setDepartment(item.name)
                                setSelected(new Set())
                            }}
                        >
                            {item.name} ({item.count})
                        </button>
                    ))}
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 12,
                    }}
                >
                    {STATUS_TABS.map((tab) => (
                        <button
                            type="button"
                            key={tab}
                            style={chipStyle(statusTab === tab)}
                            onClick={() => {
                                setStatusTab(tab)
                                setSelected(new Set())
                            }}
                        >
                            {tab} ({tabCounts[tab] ?? 0})
                        </button>
                    ))}
                </div>

                <div className="hr-toolbar">
                    <label className="hr-search">
                        <Search size={17} />
                        <input
                            type="search"
                            placeholder="Search employee or department..."
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value)
                                setSelected(new Set())
                            }}
                        />
                    </label>

                    <button
                        type="button"
                        className="hr-button hr-button-secondary"
                        disabled={saving || unmarkedInScope.length === 0}
                        onClick={() =>
                            markMany(
                                unmarkedInScope.map((row) => row.employeeId),
                                'Present'
                            )
                        }
                    >
                        <CheckCircle2 size={16} />
                        Mark {unmarkedInScope.length} unmarked as Present
                    </button>

                    <button
                        type="button"
                        className="hr-button hr-button-secondary"
                        disabled={loading || saving}
                        onClick={load}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>

                {selectedVisible.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                            margin: '12px 0',
                            padding: 10,
                            borderRadius: 8,
                            background: '#f5f3ff',
                        }}
                    >
                        <strong>{selectedVisible.length} selected</strong>

                        {STATUSES.map((status) => (
                            <button
                                type="button"
                                key={status}
                                className="hr-button hr-button-secondary"
                                disabled={saving}
                                onClick={() =>
                                    markMany(
                                        selectedVisible.map(
                                            (row) => row.employeeId
                                        ),
                                        status
                                    )
                                }
                            >
                                {status === 'Absent' ? (
                                    <UserX size={14} />
                                ) : null}
                                Mark {status}
                            </button>
                        ))}

                        <button
                            type="button"
                            className="hr-button hr-button-secondary"
                            disabled={saving}
                            onClick={() => setSelected(new Set())}
                        >
                            Clear selection
                        </button>
                    </div>
                )}

                {message && (
                    <p className="hr-success-message" role="status">
                        {message}
                    </p>
                )}

                {apiError && (
                    <p role="alert" className="hr-error-message">
                        {apiError}
                    </p>
                )}

                <div className="hr-table-wrap">
                    <table className="hr-table">
                        <thead>
                        <tr>
                            <th style={{ width: 36 }}>
                                <input
                                    type="checkbox"
                                    checked={allVisibleSelected}
                                    onChange={toggleAllVisible}
                                    disabled={visibleRows.length === 0}
                                    aria-label="Select all visible employees"
                                />
                            </th>
                            <th>EMPLOYEE</th>
                            <th>DEPARTMENT</th>
                            <th>CHECK IN</th>
                            <th>CHECK OUT</th>
                            <th>STATUS</th>
                            <th>MARK AS</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="hr-empty">
                                        Loading attendance records...
                                    </div>
                                </td>
                            </tr>
                        ) : visibleRows.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="hr-empty">
                                        {apiError
                                            ? 'Attendance could not be loaded.'
                                            : 'No employees match these filters.'}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            visibleRows.map((row) => (
                                <tr key={row.employeeId}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selected.has(
                                                row.employeeId
                                            )}
                                            onChange={() =>
                                                toggleRow(row.employeeId)
                                            }
                                            aria-label={`Select ${row.name}`}
                                        />
                                    </td>

                                    <td>
                                        <div className="hr-person">
                                            <div className="hr-avatar">
                                                {row.name
                                                    .split(' ')
                                                    .map((part) => part[0])
                                                    .join('')
                                                    .slice(0, 2)}
                                            </div>
                                            <strong>{row.name}</strong>
                                        </div>
                                    </td>

                                    <td>{row.department}</td>

                                    <td>
                                            <span className="hr-time">
                                                <Clock3 size={14} />
                                                {row.checkIn}
                                            </span>
                                    </td>

                                    <td>{row.checkOut}</td>

                                    <td>
                                        <AttendanceStatus
                                            status={row.status}
                                        />
                                    </td>

                                    <td>
                                        <select
                                            className="hr-row-select"
                                            value={row.status}
                                            disabled={saving}
                                            onChange={(event) =>
                                                markMany(
                                                    [row.employeeId],
                                                    event.target.value
                                                )
                                            }
                                            aria-label={`Mark attendance for ${row.name}`}
                                        >
                                            {row.status === NOT_MARKED && (
                                                <option
                                                    value={NOT_MARKED}
                                                    disabled
                                                >
                                                    Not Marked
                                                </option>
                                            )}

                                            {STATUSES.map((status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="hr-table-footer">
                    Showing {loading ? '…' : visibleRows.length} employee
                    {!loading && visibleRows.length !== 1 ? 's' : ''}
                </div>
            </div>
        </section>
    )
}
