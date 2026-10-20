
import { useEffect, useMemo, useState } from 'react'
import {
    Search,
    Download,
    Wallet,
    CircleCheck,
    Clock3,
    Banknote,
    Eye,
    X,
    FileText,
    CalendarDays,
    RefreshCw,
    Plus,
} from 'lucide-react'

import {
    getPayrollRecords,
    updatePayrollStatus,
    createPayrollRecord,
    getPayrollEmployees,
} from '../../services/payrollService'

const money = (value) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0))

const getEmployee = (record) => record?.employee ?? {}

const getStatusLabel = (status) => {
    if (status === 'PAID') return 'Paid'
    if (status === 'APPROVED') return 'Approved'
    return 'Draft'
}

function PayrollStatus({ status }) {
    const className =
        status === 'PAID' || status === 'APPROVED'
            ? 'approved'
            : 'pending'

    return (
        <span className={`hr-status ${className}`}>
            <span />
            {getStatusLabel(status)}
        </span>
    )
}

function getErrorMessage(error) {
    return (
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Something went wrong.'
    )
}

function payPeriodLabel(period) {
    if (!period) return 'Not available'

    const [year, month] = period.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)

    return date.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
    })
}

const initialForm = () => ({
    employeeId: '',
    payPeriod: new Date().toISOString().slice(0, 7),
    basicSalary: '',
    allowances: '0',
    deductions: '0',
})

export default function Payroll() {
    const [records, setRecords] = useState([])
    const [employees, setEmployees] = useState([])

    const [search, setSearch] = useState('')
    const [department, setDepartment] = useState('All Departments')
    const [statusFilter, setStatusFilter] = useState('All Statuses')

    const [selectedPayroll, setSelectedPayroll] = useState(null)
    const [showCreateForm, setShowCreateForm] = useState(false)

    const [form, setForm] = useState(initialForm)
    const [loading, setLoading] = useState(true)
    const [employeesLoading, setEmployeesLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [updatingId, setUpdatingId] = useState(null)

    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    async function loadPayroll(showLoader = true) {
        if (showLoader) setLoading(true)

        setError('')

        try {
            const data = await getPayrollRecords()
            setRecords(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    async function loadEmployees() {
        setEmployeesLoading(true)

        try {
            const data = await getPayrollEmployees()
            setEmployees(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setEmployeesLoading(false)
        }
    }

    useEffect(() => {
        loadPayroll()
        loadEmployees()
    }, [])

    const departments = useMemo(
        () => [
            'All Departments',
            ...new Set(
                records
                    .map((record) => getEmployee(record).department)
                    .filter(Boolean)
            ),
        ],
        [records]
    )

    const filteredRecords = useMemo(() => {
        const query = search.trim().toLowerCase()

        return records.filter((record) => {
            const employee = getEmployee(record)

            const matchesSearch =
                !query ||
                (employee.name ?? '').toLowerCase().includes(query) ||
                (employee.department ?? '').toLowerCase().includes(query) ||
                (employee.jobTitle ?? '').toLowerCase().includes(query)

            const matchesDepartment =
                department === 'All Departments' ||
                employee.department === department

            const matchesStatus =
                statusFilter === 'All Statuses' ||
                getStatusLabel(record.status) === statusFilter

            return matchesSearch && matchesDepartment && matchesStatus
        })
    }, [records, search, department, statusFilter])

    const totals = useMemo(
        () => ({
            gross: records.reduce(
                (sum, record) =>
                    sum +
                    Number(record.basicSalary ?? 0) +
                    Number(record.allowances ?? 0),
                0
            ),
            deductions: records.reduce(
                (sum, record) => sum + Number(record.deductions ?? 0),
                0
            ),
            paid: records.filter((record) => record.status === 'PAID').length,
            outstanding: records.filter((record) => record.status !== 'PAID')
                .length,
        }),
        [records]
    )

    async function handleCreatePayroll(event) {
        event.preventDefault()
        setError('')
        setMessage('')

        const basicSalary = Number(form.basicSalary)
        const allowances = Number(form.allowances || 0)
        const deductions = Number(form.deductions || 0)

        if (!form.employeeId) {
            setError('Please select an employee.')
            return
        }

        if (!form.payPeriod) {
            setError('Please select a pay period.')
            return
        }

        if (
            form.basicSalary.trim() === '' ||
            !Number.isFinite(basicSalary) ||
            !Number.isFinite(allowances) ||
            !Number.isFinite(deductions) ||
            basicSalary < 0 ||
            allowances < 0 ||
            deductions < 0
        ) {
            setError('Enter valid, non-negative salary amounts.')
            return
        }

        if (deductions > basicSalary + allowances) {
            setError('Deductions cannot exceed salary plus allowances.')
            return
        }

        setSaving(true)

        try {
            await createPayrollRecord({
                employeeId: Number(form.employeeId),
                payPeriod: form.payPeriod,
                basicSalary,
                allowances,
                deductions,
            })

            await loadPayroll(false)

            setForm(initialForm())
            setShowCreateForm(false)
            setSearch('')
            setDepartment('All Departments')
            setStatusFilter('All Statuses')
            setMessage('Payroll record created successfully.')
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setSaving(false)
        }
    }

    async function processPayroll(record) {
        if (record.status === 'PAID') return

        setUpdatingId(record.id)
        setError('')
        setMessage('')

        try {
            const updated = await updatePayrollStatus(record.id, 'PAID')

            setRecords((current) =>
                current.map((item) =>
                    item.id === record.id ? updated : item
                )
            )

            setSelectedPayroll((current) =>
                current?.id === record.id ? updated : current
            )

            setMessage('Payroll record marked as paid.')
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setUpdatingId(null)
        }
    }

    function exportCSV() {
        if (filteredRecords.length === 0) return

        const headers = [
            'Employee',
            'Department',
            'Role',
            'Pay Period',
            'Base Salary',
            'Allowances',
            'Deductions',
            'Net Pay',
            'Status',
        ]

        const rows = filteredRecords.map((record) => {
            const employee = getEmployee(record)

            return [
                employee.name ?? '',
                employee.department ?? '',
                employee.jobTitle ?? '',
                record.payPeriod ?? '',
                record.basicSalary ?? 0,
                record.allowances ?? 0,
                record.deductions ?? 0,
                record.netPay ?? 0,
                record.status ?? '',
            ]
        })

        const csv = [headers, ...rows]
            .map((row) =>
                row
                    .map(
                        (value) =>
                            `"${String(value).replaceAll('"', '""')}"`
                    )
                    .join(',')
            )
            .join('\r\n')

        const blob = new Blob(['\uFEFF', csv], {
            type: 'text/csv;charset=utf-8;',
        })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = 'nexushr-payroll.csv'
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    function updateForm(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }))
    }

    return (
        <section className="hr-page">
            <div className="hr-page-heading">
                <div>
                    <div className="hr-breadcrumb">Workspace / Payroll</div>
                    <h1>Payroll Management</h1>
                    <p>
                        Review salary records, deductions, and payment status.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        className="hr-button"
                        onClick={() => {
                            setError('')
                            setMessage('')
                            setForm(initialForm())
                            setShowCreateForm(true)
                        }}
                    >
                        <Plus size={16} /> Create payroll
                    </button>

                    <button
                        className="hr-button hr-button-secondary"
                        onClick={exportCSV}
                        disabled={filteredRecords.length === 0}
                    >
                        <Download size={16} /> Export payroll
                    </button>

                    <button
                        className="hr-button hr-button-secondary"
                        onClick={() => loadPayroll()}
                        disabled={loading}
                        title="Refresh payroll records"
                        aria-label="Refresh payroll records"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {error && (
                <p className="hr-error-message" role="alert">
                    {error}
                </p>
            )}

            {message && (
                <p className="hr-success-message" role="status">
                    {message}
                </p>
            )}

            {showCreateForm && (
                <div
                    className="hr-panel"
                    style={{ marginBottom: 20, padding: 24 }}
                >
                    <div className="hr-panel-heading">
                        <div>
                            <h2>Create payroll record</h2>
                            <p>
                                Select an existing employee and enter their
                                salary details.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="employee-modal-close"
                            onClick={() => setShowCreateForm(false)}
                            aria-label="Close payroll form"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleCreatePayroll}>
                        <div
                            className="hr-toolbar"
                            style={{
                                alignItems: 'stretch',
                                flexWrap: 'wrap',
                            }}
                        >
                            <label style={{ flex: '1 1 220px' }}>
                                Employee
                                <select
                                    className="hr-select"
                                    style={{ width: '100%', marginTop: 8 }}
                                    value={form.employeeId}
                                    onChange={(event) =>
                                        updateForm(
                                            'employeeId',
                                            event.target.value
                                        )
                                    }
                                    required
                                    disabled={employeesLoading}
                                >
                                    <option value="">
                                        {employeesLoading
                                            ? 'Loading employees...'
                                            : 'Select employee'}
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

                            <label style={{ flex: '1 1 180px' }}>
                                Pay period
                                <input
                                    className="hr-select"
                                    style={{ width: '100%', marginTop: 8 }}
                                    type="month"
                                    value={form.payPeriod}
                                    onChange={(event) =>
                                        updateForm(
                                            'payPeriod',
                                            event.target.value
                                        )
                                    }
                                    required
                                />
                            </label>

                            <label style={{ flex: '1 1 180px' }}>
                                Basic salary (₹)
                                <input
                                    className="hr-select"
                                    style={{ width: '100%', marginTop: 8 }}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.basicSalary}
                                    onChange={(event) =>
                                        updateForm(
                                            'basicSalary',
                                            event.target.value
                                        )
                                    }
                                    required
                                />
                            </label>

                            <label style={{ flex: '1 1 180px' }}>
                                Allowances (₹)
                                <input
                                    className="hr-select"
                                    style={{ width: '100%', marginTop: 8 }}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.allowances}
                                    onChange={(event) =>
                                        updateForm(
                                            'allowances',
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label style={{ flex: '1 1 180px' }}>
                                Deductions (₹)
                                <input
                                    className="hr-select"
                                    style={{ width: '100%', marginTop: 8 }}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.deductions}
                                    onChange={(event) =>
                                        updateForm(
                                            'deductions',
                                            event.target.value
                                        )
                                    }
                                />
                            </label>
                        </div>

                        {employees.length === 0 && !employeesLoading && (
                            <p className="hr-error-message">
                                No employees are available. Create an employee
                                before creating payroll.
                            </p>
                        )}

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 12,
                                marginTop: 20,
                            }}
                        >
                            <button
                                type="button"
                                className="hr-button hr-button-secondary"
                                onClick={() => setShowCreateForm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="hr-button"
                                disabled={
                                    saving ||
                                    employeesLoading ||
                                    employees.length === 0
                                }
                            >
                                {saving ? 'Saving...' : 'Save payroll'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="hr-summary-grid">
                <div className="hr-summary-card">
                    <div className="hr-summary-icon purple">
                        <Wallet size={20} />
                    </div>
                    <span>Gross payroll</span>
                    <strong>{money(totals.gross)}</strong>
                    <small>Base salary + allowances</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon green">
                        <CircleCheck size={20} />
                    </div>
                    <span>Paid</span>
                    <strong>{totals.paid}</strong>
                    <small>Of {records.length} records</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon orange">
                        <Clock3 size={20} />
                    </div>
                    <span>Outstanding</span>
                    <strong>{totals.outstanding}</strong>
                    <small>Not yet marked paid</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon red">
                        <Banknote size={20} />
                    </div>
                    <span>Total deductions</span>
                    <strong>{money(totals.deductions)}</strong>
                    <small>Across payroll records</small>
                </div>
            </div>

            <div className="hr-panel">
                <div className="hr-panel-heading">
                    <div>
                        <h2>Payroll records</h2>
                        <p>Stored employee salary and payment information.</p>
                    </div>

                    <span className="hr-count-label">
                        <CalendarDays size={15} /> All pay periods
                    </span>
                </div>

                <div className="hr-toolbar">
                    <label className="hr-search">
                        <Search size={17} />
                        <input
                            type="search"
                            placeholder="Search employee or department..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>

                    <select
                        className="hr-select"
                        value={department}
                        onChange={(event) => setDepartment(event.target.value)}
                        aria-label="Filter payroll by department"
                    >
                        {departments.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <select
                        className="hr-select"
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                        aria-label="Filter payroll by status"
                    >
                        <option>All Statuses</option>
                        <option>Draft</option>
                        <option>Approved</option>
                        <option>Paid</option>
                    </select>
                </div>

                <div className="hr-table-wrap">
                    <table className="hr-table">
                        <thead>
                        <tr>
                            <th>EMPLOYEE</th>
                            <th>PAY PERIOD</th>
                            <th>BASE SALARY</th>
                            <th>ALLOWANCES</th>
                            <th>DEDUCTIONS</th>
                            <th>NET PAY</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={8}>
                                    <div className="hr-empty">
                                        Loading payroll records...
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredRecords.map((record) => {
                                const employee = getEmployee(record)

                                return (
                                    <tr key={record.id}>
                                        <td>
                                            <div className="hr-person">
                                                <div className="hr-avatar">
                                                    {(employee.name ?? '?')
                                                        .split(' ')
                                                        .filter(Boolean)
                                                        .map(
                                                            (part) =>
                                                                part[0]
                                                        )
                                                        .join('')
                                                        .slice(0, 2)}
                                                </div>

                                                <div className="hr-person-text">
                                                    <strong>
                                                        {employee.name ??
                                                            'Employee unavailable'}
                                                    </strong>
                                                    <small>
                                                        {employee.department ??
                                                            'No department'}
                                                        {employee.jobTitle
                                                            ? ` · ${employee.jobTitle}`
                                                            : ''}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {payPeriodLabel(record.payPeriod)}
                                        </td>
                                        <td>{money(record.basicSalary)}</td>
                                        <td className="hr-positive-value">
                                            +{money(record.allowances)}
                                        </td>
                                        <td className="hr-negative-value">
                                            −{money(record.deductions)}
                                        </td>
                                        <td>
                                            <strong>
                                                {money(record.netPay)}
                                            </strong>
                                        </td>
                                        <td>
                                            <PayrollStatus
                                                status={record.status}
                                            />
                                        </td>
                                        <td>
                                            <div className="hr-payroll-actions">
                                                <button
                                                    type="button"
                                                    title="View payslip"
                                                    aria-label={`View payslip for ${employee.name ?? 'employee'}`}
                                                    onClick={() =>
                                                        setSelectedPayroll(
                                                            record
                                                        )
                                                    }
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                {record.status !== 'PAID' && (
                                                    <button
                                                        type="button"
                                                        className="hr-process-button"
                                                        title="Mark as paid"
                                                        disabled={
                                                            updatingId ===
                                                            record.id
                                                        }
                                                        onClick={() =>
                                                            processPayroll(
                                                                record
                                                            )
                                                        }
                                                    >
                                                        <CircleCheck
                                                            size={16}
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}

                        {!loading && filteredRecords.length === 0 && (
                            <tr>
                                <td colSpan={8}>
                                    <div className="hr-empty">
                                        {error
                                            ? 'Payroll records could not be loaded.'
                                            : records.length === 0
                                                ? 'No payroll records exist yet.'
                                                : 'No payroll records match your filters.'}
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="hr-table-footer">
                    Showing {filteredRecords.length} of {records.length} payroll
                    records. Net pay is calculated by the backend as base salary
                    + allowances − deductions.
                </div>
            </div>

            {selectedPayroll && (
                <div
                    className="employee-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedPayroll(null)
                        }
                    }}
                >
                    <div
                        className="employee-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payslip-title"
                    >
                        <div className="employee-modal-header">
                            <div>
                                <h2 id="payslip-title">Payslip preview</h2>
                                <p>
                                    {payPeriodLabel(
                                        selectedPayroll.payPeriod
                                    )}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="employee-modal-close"
                                onClick={() => setSelectedPayroll(null)}
                                aria-label="Close payslip"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="hr-payslip-brand">
                            <div className="hr-payslip-logo">
                                <FileText size={23} />
                            </div>
                            <div>
                                <strong>NexusHR</strong>
                                <span>Employee payslip</span>
                            </div>
                        </div>

                        <div className="hr-payslip-person">
                            <h3>
                                {getEmployee(selectedPayroll).name ?? 'Employee'}
                            </h3>
                            <p>
                                {getEmployee(selectedPayroll).jobTitle ?? ''}
                            </p>
                            <p>
                                {getEmployee(selectedPayroll).department ?? ''}
                            </p>
                        </div>

                        <div className="hr-payslip-lines">
                            <div>
                                <span>Base salary</span>
                                <strong>
                                    {money(selectedPayroll.basicSalary)}
                                </strong>
                            </div>
                            <div>
                                <span>Allowances</span>
                                <strong className="hr-positive-value">
                                    {money(selectedPayroll.allowances)}
                                </strong>
                            </div>
                            <div>
                                <span>Deductions</span>
                                <strong className="hr-negative-value">
                                    −{money(selectedPayroll.deductions)}
                                </strong>
                            </div>
                            <div className="hr-payslip-net">
                                <span>Net pay</span>
                                <strong>{money(selectedPayroll.netPay)}</strong>
                            </div>
                        </div>

                        <p className="hr-payslip-note">
                            Status: {getStatusLabel(selectedPayroll.status)}.
                            This preview uses the payroll record stored in the
                            system.
                        </p>

                        <div className="employee-modal-footer">
                            <button
                                type="button"
                                className="employee-secondary-button"
                                onClick={() => setSelectedPayroll(null)}
                            >
                                Close
                            </button>

                            {selectedPayroll.status !== 'PAID' && (
                                <button
                                    type="button"
                                    className="employee-primary-button"
                                    disabled={
                                        updatingId === selectedPayroll.id
                                    }
                                    onClick={() =>
                                        processPayroll(selectedPayroll)
                                    }
                                >
                                    <CircleCheck size={16} /> Mark paid
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
