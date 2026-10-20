
import { useEffect, useMemo, useState } from 'react'
import {
    Search,
    Plus,
    Users,
    Download,
    Eye,
    Pencil,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    Mail,
    BriefcaseBusiness,
    RefreshCw,
} from 'lucide-react'
import { employeeApi } from '../../services/api.js'
import '../../App.css'

function mapEmployee(employee) {
    const statusMap = {
        ACTIVE: 'Active',
        INACTIVE: 'Inactive',
        ON_LEAVE: 'On Leave',
        'ON LEAVE': 'On Leave',
    }

    return {
        id: employee.id,
        name: employee.name ?? '',
        email: employee.email ?? '',
        department: employee.department ?? 'Unassigned',
        designation: employee.jobTitle ?? '',
        status:
            statusMap[employee.status?.toUpperCase()] ??
            employee.status ??
            'Unknown',
        type: employee.employmentType ?? employee.type ?? 'Not specified',
        joined: employee.joiningDate ?? '',
        phone: employee.phone ?? '',
    }
}

function toApiEmployee(employee) {
    const statusMap = {
        Active: 'ACTIVE',
        Inactive: 'INACTIVE',
        'On Leave': 'ON_LEAVE',
    }

    return {
        name: employee.name.trim(),
        email: employee.email.trim(),
        department: employee.department,
        jobTitle: employee.designation.trim(),
        status: statusMap[employee.status] ?? employee.status.toUpperCase(),
        phone: employee.phone.trim(),
        joiningDate: employee.joined || null,
    }
}

function formatDate(date) {
    if (!date) return '—'

    const parsedDate = new Date(`${date}`.slice(0, 10) + 'T00:00:00')

    if (Number.isNaN(parsedDate.getTime())) return date

    return parsedDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function getInitials(name) {
    return (name || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')
}

function downloadCsv(employees) {
    const columns = [
        ['ID', 'id'],
        ['Name', 'name'],
        ['Email', 'email'],
        ['Department', 'department'],
        ['Designation', 'designation'],
        ['Status', 'status'],
        ['Employment Type', 'type'],
        ['Joining Date', 'joined'],
        ['Phone', 'phone'],
    ]

    const escapeCsv = (value) =>
        `"${String(value ?? '').replace(/"/g, '""')}"`

    const csv = [
        columns.map(([heading]) => escapeCsv(heading)).join(','),
        ...employees.map((employee) =>
            columns
                .map(([, key]) => escapeCsv(employee[key]))
                .join(',')
        ),
    ].join('\r\n')

    const blob = new Blob(['\uFEFF' + csv], {
        type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'employees.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

const emptyForm = {
    name: '',
    email: '',
    department: '',
    designation: '',
    status: 'Active',
    type: 'Full-time',
    joined: '',
    phone: '',
}

export default function Employees() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [apiError, setApiError] = useState('')
    const [actionError, setActionError] = useState('')
    const [search, setSearch] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState('All Departments')
    const [statusFilter, setStatusFilter] = useState('All Statuses')
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(6)

    const [modal, setModal] = useState(null)
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)

    const departments = useMemo(
        () => [
            'All Departments',
            ...new Set(
                employees
                    .map((employee) => employee.department)
                    .filter(
                        (department) =>
                            department && department !== 'Unassigned'
                    )
            ),
        ],
        [employees]
    )

    async function loadEmployees() {
        setLoading(true)
        setApiError('')

        try {
            const response = await employeeApi.getAll()
            const data = Array.isArray(response.data)
                ? response.data
                : response.data
                  ? [response.data]
                  : []

            setEmployees(data.map(mapEmployee))
        } catch (error) {
            console.error('Failed to load employees:', error)
            setApiError(
                error.response?.data?.message ||
                    'Could not load employees. Check that the backend and database are running.'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadEmployees()
    }, [])

    const filteredEmployees = useMemo(() => {
        const query = search.trim().toLowerCase()

        return employees.filter((employee) => {
            const matchesSearch =
                !query ||
                [
                    employee.name,
                    employee.email,
                    employee.department,
                    employee.designation,
                    employee.phone,
                ].some((value) =>
                    String(value ?? '').toLowerCase().includes(query)
                )

            const matchesDepartment =
                departmentFilter === 'All Departments' ||
                employee.department === departmentFilter

            const matchesStatus =
                statusFilter === 'All Statuses' ||
                employee.status === statusFilter

            return matchesSearch && matchesDepartment && matchesStatus
        })
    }, [employees, search, departmentFilter, statusFilter])

    const totalPages = Math.max(
        1,
        Math.ceil(filteredEmployees.length / pageSize)
    )

    const safePage = Math.min(currentPage, totalPages)

    const paginatedEmployees = filteredEmployees.slice(
        (safePage - 1) * pageSize,
        safePage * pageSize
    )

    const activeCount = employees.filter(
        (employee) => employee.status === 'Active'
    ).length

    const onLeaveCount = employees.filter(
        (employee) => employee.status === 'On Leave'
    ).length

    function updateFilter(callback, value) {
        callback(value)
        setCurrentPage(1)
    }

    function openAddModal() {
        setForm({
            ...emptyForm,
            department:
                departments.find(
                    (department) => department !== 'All Departments'
                ) ?? '',
        })
        setSelectedEmployee(null)
        setActionError('')
        setModal('add')
    }

    function openEditModal(employee) {
        setSelectedEmployee(employee)
        setForm({
            name: employee.name,
            email: employee.email,
            department:
                employee.department === 'Unassigned'
                    ? ''
                    : employee.department,
            designation: employee.designation,
            status: employee.status,
            type: employee.type,
            joined: employee.joined,
            phone: employee.phone,
        })
        setActionError('')
        setModal('edit')
    }

    function closeModal() {
        if (saving) return

        setModal(null)
        setSelectedEmployee(null)
        setActionError('')
    }

    function handleFormChange(event) {
        const { name, value } = event.target

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setSaving(true)
        setActionError('')

        try {
            const payload = toApiEmployee(form)

            if (modal === 'edit' && selectedEmployee) {
                await employeeApi.update(selectedEmployee.id, payload)
            } else {
                await employeeApi.create(payload)
            }

            setModal(null)
            setSelectedEmployee(null)
            await loadEmployees()
        } catch (error) {
            console.error('Failed to save employee:', error)
            setActionError(
                error.response?.data?.message ||
                    error.response?.data?.error ||
                    'Could not save employee. Check the entered details and backend response.'
            )
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(employee) {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${employee.name}? This action cannot be undone.`
        )

        if (!confirmed) return

        setActionError('')

        try {
            await employeeApi.delete(employee.id)

            if (selectedEmployee?.id === employee.id) {
                setSelectedEmployee(null)
                setModal(null)
            }

            await loadEmployees()
        } catch (error) {
            console.error('Failed to delete employee:', error)
            setActionError(
                error.response?.data?.message ||
                    'Could not delete employee. Please try again.'
            )
        }
    }

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '8px',
        background: 'var(--card-bg, #fff)',
        color: 'var(--text-primary, #0f172a)',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
    }

    const fieldStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minWidth: 0,
    }

    const labelStyle = {
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-secondary, #475569)',
    }

    const primaryButtonStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 14px',
        border: 'none',
        borderRadius: '8px',
        background: '#4f46e5',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
    }

    const secondaryButtonStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '9px 12px',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '8px',
        background: 'transparent',
        color: 'var(--text-primary, #334155)',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
    }

    const statusStyle = (status) => {
        const styles = {
            Active: { background: '#dcfce7', color: '#166534' },
            Inactive: { background: '#f1f5f9', color: '#475569' },
            'On Leave': { background: '#fef3c7', color: '#92400e' },
        }

        return {
            display: 'inline-block',
            padding: '4px 9px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            ...(styles[status] ?? {
                background: '#f1f5f9',
                color: '#475569',
            }),
        }
    }

    return (
        <div className="page-container">
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                    marginBottom: '24px',
                }}
            >
                <div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: '26px',
                            fontWeight: 700,
                            color: 'var(--text-primary, #0f172a)',
                        }}
                    >
                        Employees
                    </h1>
                    <p
                        style={{
                            margin: '7px 0 0',
                            color: 'var(--text-secondary, #64748b)',
                            fontSize: '14px',
                        }}
                    >
                        Manage employee records and information.
                    </p>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',
                    }}
                >
                    <button
                        type="button"
                        style={secondaryButtonStyle}
                        onClick={loadEmployees}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        type="button"
                        style={secondaryButtonStyle}
                        onClick={() => downloadCsv(filteredEmployees)}
                        disabled={filteredEmployees.length === 0}
                    >
                        <Download size={16} />
                        Export CSV
                    </button>

                    <button
                        type="button"
                        style={primaryButtonStyle}
                        onClick={openAddModal}
                    >
                        <Plus size={17} />
                        Add Employee
                    </button>
                </div>
            </div>

            {apiError && (
                <div
                    role="alert"
                    style={{
                        marginBottom: '18px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        color: '#991b1b',
                        fontSize: '14px',
                    }}
                >
                    {apiError}
                </div>
            )}

            {actionError && !modal && (
                <div
                    role="alert"
                    style={{
                        marginBottom: '18px',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        color: '#991b1b',
                        fontSize: '14px',
                    }}
                >
                    {actionError}
                </div>
            )}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                    gap: '16px',
                    marginBottom: '22px',
                }}
            >
                {[
                    {
                        label: 'Total Employees',
                        value: employees.length,
                        icon: Users,
                        color: '#4f46e5',
                    },
                    {
                        label: 'Active Employees',
                        value: activeCount,
                        icon: BriefcaseBusiness,
                        color: '#16a34a',
                    },
                    {
                        label: 'On Leave',
                        value: onLeaveCount,
                        icon: SlidersHorizontal,
                        color: '#d97706',
                    },
                ].map((item) => {
                    const Icon = item.icon

                    return (
                        <div
                            key={item.label}
                            style={{
                                padding: '18px',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                borderRadius: '12px',
                                background: 'var(--card-bg, #fff)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: '13px',
                                        color: 'var(--text-secondary, #64748b)',
                                        marginBottom: '8px',
                                    }}
                                >
                                    {item.label}
                                </div>
                                <div
                                    style={{
                                        fontSize: '27px',
                                        fontWeight: 700,
                                        color: 'var(--text-primary, #0f172a)',
                                    }}
                                >
                                    {loading ? '—' : item.value}
                                </div>
                            </div>

                            <div
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '10px',
                                    display: 'grid',
                                    placeItems: 'center',
                                    background: `${item.color}18`,
                                    color: item.color,
                                }}
                            >
                                <Icon size={22} />
                            </div>
                        </div>
                    )
                })}
            </div>

            <div
                style={{
                    padding: '16px',
                    marginBottom: '16px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: '12px',
                    background: 'var(--card-bg, #fff)',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        flex: '1 1 240px',
                        minWidth: 0,
                    }}
                >
                    <Search
                        size={17}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                        }}
                    />
                    <input
                        aria-label="Search employees"
                        value={search}
                        onChange={(event) =>
                            updateFilter(setSearch, event.target.value)
                        }
                        placeholder="Search name, email, department..."
                        style={{
                            ...inputStyle,
                            paddingLeft: '38px',
                        }}
                    />
                </div>

                <select
                    aria-label="Filter by department"
                    value={departmentFilter}
                    onChange={(event) =>
                        updateFilter(setDepartmentFilter, event.target.value)
                    }
                    style={{ ...inputStyle, width: 'auto', minWidth: '175px' }}
                >
                    {departments.map((department) => (
                        <option key={department} value={department}>
                            {department}
                        </option>
                    ))}
                </select>

                <select
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(event) =>
                        updateFilter(setStatusFilter, event.target.value)
                    }
                    style={{ ...inputStyle, width: 'auto', minWidth: '145px' }}
                >
                    {[
                        'All Statuses',
                        'Active',
                        'On Leave',
                        'Inactive',
                    ].map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    style={secondaryButtonStyle}
                    onClick={() => {
                        setSearch('')
                        setDepartmentFilter('All Departments')
                        setStatusFilter('All Statuses')
                        setCurrentPage(1)
                    }}
                >
                    Clear filters
                </button>
            </div>

            <div
                style={{
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: '12px',
                    background: 'var(--card-bg, #fff)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '16px 18px',
                        borderBottom: '1px solid var(--border-color, #e2e8f0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        flexWrap: 'wrap',
                    }}
                >
                    <div
                        style={{
                            fontWeight: 650,
                            color: 'var(--text-primary, #0f172a)',
                        }}
                    >
                        Employee Directory
                    </div>
                    <div
                        style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary, #64748b)',
                        }}
                    >
                        {loading
                            ? 'Loading employees...'
                            : `${filteredEmployees.length} employee${filteredEmployees.length === 1 ? '' : 's'} found`}
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table
                        style={{
                            width: '100%',
                            minWidth: '850px',
                            borderCollapse: 'collapse',
                            textAlign: 'left',
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: 'var(--table-header-bg, #f8fafc)',
                                }}
                            >
                                {[
                                    'Employee',
                                    'Department',
                                    'Designation',
                                    'Status',
                                    'Joining Date',
                                    'Actions',
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        style={{
                                            padding: '13px 16px',
                                            fontSize: '12px',
                                            fontWeight: 650,
                                            color: 'var(--text-secondary, #64748b)',
                                            whiteSpace: 'nowrap',
                                            borderBottom:
                                                '1px solid var(--border-color, #e2e8f0)',
                                        }}
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            padding: '42px 16px',
                                            textAlign: 'center',
                                            color: 'var(--text-secondary, #64748b)',
                                        }}
                                    >
                                        Loading employees...
                                    </td>
                                </tr>
                            ) : paginatedEmployees.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        style={{
                                            padding: '46px 16px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Users
                                            size={30}
                                            style={{
                                                color: '#94a3b8',
                                                marginBottom: '10px',
                                            }}
                                        />
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                color: 'var(--text-primary, #0f172a)',
                                            }}
                                        >
                                            {employees.length === 0
                                                ? 'No employees yet'
                                                : 'No matching employees'}
                                        </div>
                                        <p
                                            style={{
                                                margin: '7px 0 0',
                                                fontSize: '13px',
                                                color: 'var(--text-secondary, #64748b)',
                                            }}
                                        >
                                            {employees.length === 0
                                                ? 'Employee records added through the system will appear here.'
                                                : 'Try changing your search or filters.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedEmployees.map((employee) => (
                                    <tr key={employee.id}>
                                        <td
                                            style={{
                                                padding: '14px 16px',
                                                borderBottom:
                                                    '1px solid var(--border-color, #e2e8f0)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '11px',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '39px',
                                                        height: '39px',
                                                        flexShrink: 0,
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        borderRadius: '50%',
                                                        background: '#e0e7ff',
                                                        color: '#4338ca',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    {getInitials(employee.name)}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div
                                                        style={{
                                                            fontSize: '14px',
                                                            fontWeight: 600,
                                                            color: 'var(--text-primary, #0f172a)',
                                                        }}
                                                    >
                                                        {employee.name || 'Unnamed employee'}
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px',
                                                            marginTop: '4px',
                                                            fontSize: '12px',
                                                            color: 'var(--text-secondary, #64748b)',
                                                        }}
                                                    >
                                                        <Mail size={12} />
                                                        {employee.email || 'No email'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td
                                            style={{
                                                padding: '14px 16px',
                                                fontSize: '13px',
                                                color: 'var(--text-primary, #334155)',
                                                borderBottom:
                                                    '1px solid var(--border-color, #e2e8f0)',
                                            }}
                                        >
                                            {employee.department}
                                        </td>

                                        <td
                                            style={{
                                                padding: '14px 16px',
                                                fontSize: '13px',
                                                color: 'var(--text-primary, #334155)',
                                                borderBottom:
                                                    '1px solid var(--border-color, #e2e8f0)',
                                            }}
                                        >
                                            {employee.designation || '—'}
                                        </td>

                                        <td
                                            style={{
                                                padding: '14px 16px',
                                                borderBottom:
                                                    '1px solid var(--border-color, #e2e8f0)',
                                            }}
                                        >
                                            <span style={statusStyle(employee.status)}>
                                                {employee.status}
                                            </span>
                                        </td>

                                        <td
                                            style={{
                                                padding: '14px 16px',
                                                fontSize: '13px',
                                                color: 'var(--text-secondary, #64748b)',
                                                whiteSpace: 'nowrap',
                                                borderBottom:
                                                    '1px solid var(--border-color, #e2e8f0)',
                                            }}
                                        >
                                            {formatDate(employee.joined)}
                                        </td>

                                        <td
                                            style={{
                                                padding: '14px 16px',
                                                borderBottom:
                                                    '1px solid var(--border-color, #e2e8f0)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '5px',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    title="View employee"
                                                    aria-label={`View ${employee.name}`}
                                                    style={{
                                                        ...secondaryButtonStyle,
                                                        padding: '7px',
                                                        border: 'none',
                                                    }}
                                                    onClick={() => {
                                                        setSelectedEmployee(employee)
                                                        setActionError('')
                                                        setModal('view')
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Edit employee"
                                                    aria-label={`Edit ${employee.name}`}
                                                    style={{
                                                        ...secondaryButtonStyle,
                                                        padding: '7px',
                                                        border: 'none',
                                                    }}
                                                    onClick={() =>
                                                        openEditModal(employee)
                                                    }
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Delete employee"
                                                    aria-label={`Delete ${employee.name}`}
                                                    style={{
                                                        ...secondaryButtonStyle,
                                                        padding: '7px',
                                                        border: 'none',
                                                        color: '#dc2626',
                                                    }}
                                                    onClick={() =>
                                                        handleDelete(employee)
                                                    }
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        flexWrap: 'wrap',
                        padding: '14px 18px',
                        borderTop: '1px solid var(--border-color, #e2e8f0)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary, #64748b)',
                        }}
                    >
                        {filteredEmployees.length === 0
                            ? 'Showing 0 employees'
                            : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filteredEmployees.length)} of ${filteredEmployees.length}`}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        <select
                            aria-label="Employees per page"
                            value={pageSize}
                            onChange={(event) => {
                                setPageSize(Number(event.target.value))
                                setCurrentPage(1)
                            }}
                            style={{
                                ...inputStyle,
                                width: 'auto',
                                padding: '7px 9px',
                                fontSize: '12px',
                            }}
                        >
                            <option value={6}>6 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                        </select>

                        <button
                            type="button"
                            aria-label="Previous page"
                            disabled={safePage <= 1}
                            style={{
                                ...secondaryButtonStyle,
                                padding: '7px',
                                opacity: safePage <= 1 ? 0.45 : 1,
                                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                            }}
                            onClick={() =>
                                setCurrentPage((page) => Math.max(1, page - 1))
                            }
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <span
                            style={{
                                fontSize: '13px',
                                color: 'var(--text-primary, #334155)',
                                minWidth: '65px',
                                textAlign: 'center',
                            }}
                        >
                            Page {safePage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            aria-label="Next page"
                            disabled={safePage >= totalPages}
                            style={{
                                ...secondaryButtonStyle,
                                padding: '7px',
                                opacity: safePage >= totalPages ? 0.45 : 1,
                                cursor:
                                    safePage >= totalPages
                                        ? 'not-allowed'
                                        : 'pointer',
                            }}
                            onClick={() =>
                                setCurrentPage((page) =>
                                    Math.min(totalPages, page + 1)
                                )
                            }
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {modal && (
                <div
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeModal()
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1000,
                        padding: '20px',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'rgba(15, 23, 42, 0.55)',
                        overflowY: 'auto',
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="employee-modal-title"
                        style={{
                            width: '100%',
                            maxWidth: modal === 'view' ? '520px' : '680px',
                            maxHeight: 'calc(100vh - 40px)',
                            overflowY: 'auto',
                            background: 'var(--card-bg, #fff)',
                            color: 'var(--text-primary, #0f172a)',
                            borderRadius: '14px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div
                            style={{
                                padding: '18px 22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                borderBottom:
                                    '1px solid var(--border-color, #e2e8f0)',
                            }}
                        >
                            <div>
                                <h2
                                    id="employee-modal-title"
                                    style={{
                                        margin: 0,
                                        fontSize: '19px',
                                        fontWeight: 700,
                                    }}
                                >
                                    {modal === 'add'
                                        ? 'Add Employee'
                                        : modal === 'edit'
                                          ? 'Edit Employee'
                                          : 'Employee Details'}
                                </h2>
                                <p
                                    style={{
                                        margin: '5px 0 0',
                                        fontSize: '13px',
                                        color: 'var(--text-secondary, #64748b)',
                                    }}
                                >
                                    {modal === 'view'
                                        ? 'Employee record and contact information'
                                        : 'Enter the employee information below'}
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close dialog"
                                onClick={closeModal}
                                style={{
                                    ...secondaryButtonStyle,
                                    padding: '7px',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {modal === 'view' && selectedEmployee ? (
                            <div style={{ padding: '22px' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        marginBottom: '24px',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '58px',
                                            height: '58px',
                                            borderRadius: '50%',
                                            background: '#e0e7ff',
                                            color: '#4338ca',
                                            display: 'grid',
                                            placeItems: 'center',
                                            fontWeight: 700,
                                            fontSize: '18px',
                                        }}
                                    >
                                        {getInitials(selectedEmployee.name)}
                                    </div>

                                    <div>
                                        <h3
                                            style={{
                                                margin: '0 0 6px',
                                                fontSize: '18px',
                                            }}
                                        >
                                            {selectedEmployee.name}
                                        </h3>
                                        <div
                                            style={{
                                                fontSize: '13px',
                                                color: 'var(--text-secondary, #64748b)',
                                            }}
                                        >
                                            {selectedEmployee.designation || 'No designation'}
                                        </div>
                                        <div style={{ marginTop: '8px' }}>
                                            <span
                                                style={statusStyle(
                                                    selectedEmployee.status
                                                )}
                                            >
                                                {selectedEmployee.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fit, minmax(180px, 1fr))',
                                        gap: '18px',
                                    }}
                                >
                                    {[
                                        ['Employee ID', selectedEmployee.id],
                                        ['Email', selectedEmployee.email],
                                        ['Phone', selectedEmployee.phone],
                                        ['Department', selectedEmployee.department],
                                        ['Employment Type', selectedEmployee.type],
                                        [
                                            'Joining Date',
                                            formatDate(selectedEmployee.joined),
                                        ],
                                    ].map(([label, value]) => (
                                        <div key={label} style={fieldStyle}>
                                            <span style={labelStyle}>{label}</span>
                                            <span
                                                style={{
                                                    fontSize: '14px',
                                                    overflowWrap: 'anywhere',
                                                }}
                                            >
                                                {value || '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '10px',
                                        marginTop: '26px',
                                    }}
                                >
                                    <button
                                        type="button"
                                        style={secondaryButtonStyle}
                                        onClick={closeModal}
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        style={primaryButtonStyle}
                                        onClick={() =>
                                            openEditModal(selectedEmployee)
                                        }
                                    >
                                        <Pencil size={15} />
                                        Edit Employee
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div
                                    style={{
                                        padding: '22px',
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fit, minmax(220px, 1fr))',
                                        gap: '17px',
                                    }}
                                >
                                    {[
                                        {
                                            name: 'name',
                                            label: 'Full Name',
                                            placeholder: 'Enter full name',
                                            required: true,
                                        },
                                        {
                                            name: 'email',
                                            label: 'Email Address',
                                            placeholder: 'name@company.com',
                                            type: 'email',
                                            required: true,
                                        },
                                        {
                                            name: 'phone',
                                            label: 'Phone Number',
                                            placeholder: 'Enter phone number',
                                        },
                                        {
                                            name: 'designation',
                                            label: 'Designation',
                                            placeholder: 'Enter job title',
                                            required: true,
                                        },
                                    ].map((field) => (
                                        <label
                                            key={field.name}
                                            style={fieldStyle}
                                        >
                                            <span style={labelStyle}>
                                                {field.label}
                                            </span>
                                            <input
                                                name={field.name}
                                                type={field.type ?? 'text'}
                                                value={form[field.name]}
                                                onChange={handleFormChange}
                                                placeholder={field.placeholder}
                                                required={field.required}
                                                style={inputStyle}
                                            />
                                        </label>
                                    ))}

                                    <label style={fieldStyle}>
                                        <span style={labelStyle}>Department</span>
                                        <input
                                            name="department"
                                            list="employee-departments"
                                            value={form.department}
                                            onChange={handleFormChange}
                                            placeholder="Enter department"
                                            required
                                            style={inputStyle}
                                        />
                                        <datalist id="employee-departments">
                                            {departments
                                                .filter(
                                                    (department) =>
                                                        department !==
                                                        'All Departments'
                                                )
                                                .map((department) => (
                                                    <option
                                                        key={department}
                                                        value={department}
                                                    />
                                                ))}
                                        </datalist>
                                    </label>

                                    <label style={fieldStyle}>
                                        <span style={labelStyle}>Status</span>
                                        <select
                                            name="status"
                                            value={form.status}
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">
                                                Inactive
                                            </option>
                                            <option value="On Leave">
                                                On Leave
                                            </option>
                                        </select>
                                    </label>

                                    <label style={fieldStyle}>
                                        <span style={labelStyle}>Joining Date</span>
                                        <input
                                            name="joined"
                                            type="date"
                                            value={form.joined || ''}
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        />
                                    </label>

                                    <label style={fieldStyle}>
                                        <span style={labelStyle}>
                                            Employment Type
                                        </span>
                                        <select
                                            name="type"
                                            value={form.type}
                                            onChange={handleFormChange}
                                            style={inputStyle}
                                        >
                                            <option value="Full-time">
                                                Full-time
                                            </option>
                                            <option value="Part-time">
                                                Part-time
                                            </option>
                                            <option value="Contract">
                                                Contract
                                            </option>
                                            <option value="Intern">
                                                Intern
                                            </option>
                                        </select>
                                    </label>
                                </div>

                                {actionError && (
                                    <div
                                        role="alert"
                                        style={{
                                            margin: '0 22px',
                                            padding: '11px 12px',
                                            borderRadius: '8px',
                                            background: '#fef2f2',
                                            color: '#991b1b',
                                            fontSize: '13px',
                                        }}
                                    >
                                        {actionError}
                                    </div>
                                )}

                                <div
                                    style={{
                                        padding: '16px 22px',
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '10px',
                                        borderTop:
                                            '1px solid var(--border-color, #e2e8f0)',
                                        marginTop: '20px',
                                    }}
                                >
                                    <button
                                        type="button"
                                        style={secondaryButtonStyle}
                                        onClick={closeModal}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            ...primaryButtonStyle,
                                            opacity: saving ? 0.7 : 1,
                                            cursor: saving
                                                ? 'not-allowed'
                                                : 'pointer',
                                        }}
                                        disabled={saving}
                                    >
                                        {saving
                                            ? 'Saving...'
                                            : modal === 'edit'
                                              ? 'Save Changes'
                                              : 'Create Employee'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
