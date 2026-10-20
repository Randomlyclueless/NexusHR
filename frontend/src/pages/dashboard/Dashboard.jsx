import { useEffect, useState } from 'react'
import {
    Users,
    CalendarDays,
    CalendarCheck,
    Wallet,
    TrendingUp,
    BrainCircuit,
    ChevronRight,
} from 'lucide-react'
import api, { leaveApi } from '../../services/api.js'

function Dashboard({ onNavigate }) {
    const [employees, setEmployees] = useState([])
    const [attendance, setAttendance] = useState([])
    const [leaves, setLeaves] = useState([])
    const [payroll, setPayroll] = useState([])
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [errors, setErrors] = useState([])

    useEffect(() => {
        let cancelled = false

        async function loadDashboard() {
            setLoading(true)

            const requests = [
                api.get('/employees'),
                api.get('/attendance'),
                leaveApi.getAll(),
                api.get('/payroll'),
                api.get('/performance'),
            ]

            const results = await Promise.allSettled(requests)

            if (cancelled) return

            const readArray = (result) => {
                if (result.status !== 'fulfilled') return []

                const data = result.value.data

                if (Array.isArray(data)) return data
                if (Array.isArray(data?.content)) return data.content
                if (Array.isArray(data?.data)) return data.data

                return data ? [data] : []
            }

            setEmployees(readArray(results[0]))
            setAttendance(readArray(results[1]))
            setLeaves(readArray(results[2]))
            setPayroll(readArray(results[3]))
            setReviews(readArray(results[4]))

            const names = [
                'Employees',
                'Attendance',
                'Leave',
                'Payroll',
                'Performance',
            ]

            const failed = results
                .map((result, index) =>
                    result.status === 'rejected' ? names[index] : null
                )
                .filter(Boolean)

            setErrors(failed)
            setLoading(false)
        }

        loadDashboard()

        return () => {
            cancelled = true
        }
    }, [])

    const today = new Date()
    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-')

    const getStatus = (record) =>
        String(record?.status ?? '').toUpperCase().replaceAll(' ', '_')

    const activeEmployees = employees.filter(
        (employee) => getStatus(employee) === 'ACTIVE'
    ).length

    const pendingLeaves = leaves.filter((leave) =>
        ['PENDING', 'SUBMITTED'].includes(getStatus(leave))
    ).length

    const todayAttendance = attendance.filter((record) => {
        const date = String(
            record.date ?? record.attendanceDate ?? record.createdAt ?? ''
        ).slice(0, 10)

        return date === todayString
    })

    const presentToday = todayAttendance.filter((record) =>
        ['PRESENT', 'LATE'].includes(getStatus(record))
    ).length

    const attendanceRate =
        todayAttendance.length > 0
            ? Math.round((presentToday / todayAttendance.length) * 100)
            : null

    const paidPayroll = payroll.filter((record) =>
        ['PAID', 'PROCESSED'].includes(getStatus(record))
    )

    const payrollTotal = paidPayroll.reduce(
        (total, record) => total + Number(record.netPay ?? 0),
        0
    )

    const formatMoney = (value) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(value)

    const departments = Object.entries(
        employees.reduce((counts, employee) => {
            const name = employee.department || 'Unassigned'
            counts[name] = (counts[name] || 0) + 1
            return counts
        }, {})
    )
        .map(([name, count]) => ({
            name,
            count,
            percent:
                employees.length > 0
                    ? Math.round((count / employees.length) * 100)
                    : 0,
        }))
        .sort((a, b) => b.count - a.count)

    const departmentColors = [
        '#6654d9',
        '#26a69a',
        '#f0a443',
        '#e7799b',
        '#6496e8',
    ]

    const stats = [
        {
            label: 'Total Employees',
            value: employees.length,
            note: `${activeEmployees} active`,
            icon: Users,
            color: 'purple',
            page: 'Employees',
        },
        {
            label: 'Present Today',
            value: todayAttendance.length ? presentToday : '—',
            note:
                attendanceRate === null
                    ? 'No attendance recorded today'
                    : `${attendanceRate}% of recorded attendance`,
            icon: CalendarCheck,
            color: 'green',
            page: 'Attendance',
        },
        {
            label: 'Pending Leave',
            value: pendingLeaves,
            note: 'Awaiting review',
            icon: CalendarDays,
            color: 'orange',
            page: 'Leave Management',
        },
        {
            label: 'Paid Payroll',
            value: formatMoney(payrollTotal),
            note: `${paidPayroll.length} paid records`,
            icon: Wallet,
            color: 'blue',
            page: 'Payroll',
        },
    ]

    const quickActions = [
        { label: 'View employees', page: 'Employees', icon: Users },
        { label: 'Review attendance', page: 'Attendance', icon: CalendarCheck },
        { label: 'Manage leave', page: 'Leave Management', icon: CalendarDays },
        { label: 'View payroll', page: 'Payroll', icon: Wallet },
        { label: 'Performance reviews', page: 'Performance', icon: TrendingUp },
        { label: 'AI workforce insights', page: 'AI Workforce Insights', icon: BrainCircuit },
    ]

    const recentRecords = [
        ...leaves.map((record) => ({
            id: `leave-${record.id}`,
            title: 'Leave request',
            description:
                record.employee?.name ??
                record.employeeName ??
                'Employee leave record',
            date: record.createdAt ?? record.submittedAt ?? record.fromDate,
            page: 'Leave Management',
            status: record.status,
        })),
        ...payroll.map((record) => ({
            id: `payroll-${record.id}`,
            title: 'Payroll record',
            description:
                record.employee?.name ??
                record.employeeName ??
                `Pay period ${record.payPeriod ?? 'not specified'}`,
            date: record.createdAt,
            page: 'Payroll',
            status: record.status,
        })),
        ...reviews.map((record) => ({
            id: `review-${record.id}`,
            title: 'Performance review',
            description:
                record.employee?.name ??
                record.employeeName ??
                record.reviewCycle ??
                'Performance review record',
            date: record.createdAt,
            page: 'Performance',
            status: record.status,
        })),
    ]
        .filter((record) => record.date)
        .sort(
            (a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, 5)

    return (
        <div className="hr-page">
            <div className="hr-page-heading">
                <div>
                    <div className="hr-breadcrumb">Workspace / Dashboard</div>
                    <h1>Dashboard Overview</h1>
                    <p>Your workforce overview, based on connected HR records.</p>
                </div>

                <span className="hr-count-label">
                    {today.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    })}
                </span>
            </div>

            {errors.length > 0 && (
                <div
                    role="status"
                    style={{
                        marginBottom: 18,
                        padding: 12,
                        borderRadius: 8,
                        background: '#fff7ed',
                        color: '#9a3412',
                        fontSize: 13,
                    }}
                >
                    Some dashboard information could not be loaded:{' '}
                    {errors.join(', ')}. Check the corresponding backend
                    endpoints.
                </div>
            )}

            <div className="hr-summary-grid">
                {stats.map((stat) => {
                    const Icon = stat.icon

                    return (
                        <button
                            type="button"
                            className="hr-summary-card"
                            key={stat.label}
                            onClick={() => onNavigate?.(stat.page)}
                            style={{
                                textAlign: 'left',
                                border: '1px solid var(--border-color, #e2e8f0)',
                                cursor: 'pointer',
                                color: 'inherit',
                            }}
                        >
                            <div className={`hr-summary-icon ${stat.color}`}>
                                <Icon size={20} />
                            </div>
                            <span>{stat.label}</span>
                            <strong>{loading ? '…' : stat.value}</strong>
                            <small>
                                {loading ? 'Loading live data…' : stat.note}
                            </small>
                        </button>
                    )
                })}
            </div>

            <div className="nexus-dashboard-grid">
                <section className="hr-panel">
                    <div className="hr-panel-heading">
                        <div>
                            <h2>Department overview</h2>
                            <p>Distribution calculated from employee records.</p>
                        </div>
                    </div>

                    <div className="nexus-departments">
                        {!loading && departments.length === 0 ? (
                            <p>No employee department data is available yet.</p>
                        ) : (
                            departments.map((department, index) => (
                                <div
                                    className="nexus-department"
                                    key={department.name}
                                >
                                    <div className="nexus-department-label">
                                        <span>{department.name}</span>
                                        <strong>{department.count}</strong>
                                    </div>
                                    <div className="nexus-progress">
                                        <span
                                            style={{
                                                width: `${department.percent}%`,
                                                background:
                                                    departmentColors[
                                                    index % departmentColors.length
                                                        ],
                                            }}
                                        />
                                    </div>
                                    <small>
                                        {department.percent}% of employees
                                    </small>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="hr-panel">
                    <div className="hr-panel-heading">
                        <div>
                            <h2>Quick actions</h2>
                            <p>Open an HR module.</p>
                        </div>
                    </div>

                    <div className="nexus-quick-actions">
                        {quickActions.map((item) => {
                            const Icon = item.icon

                            return (
                                <button
                                    type="button"
                                    className="nexus-quick-action"
                                    key={item.page}
                                    onClick={() => onNavigate?.(item.page)}
                                >
                                    <span>
                                        <Icon size={18} />
                                    </span>
                                    <strong>{item.label}</strong>
                                    <ChevronRight size={16} />
                                </button>
                            )
                        })}
                    </div>
                </section>

                <section className="hr-panel nexus-activity-panel">
                    <div className="hr-panel-heading">
                        <div>
                            <h2>Recent records</h2>
                            <p>
                                Latest dated leave, payroll, and performance
                                records returned by the backend.
                            </p>
                        </div>
                    </div>

                    <div className="nexus-activities">
                        {loading ? (
                            <p>Loading recent records…</p>
                        ) : recentRecords.length === 0 ? (
                            <p>No dated records are available to display.</p>
                        ) : (
                            recentRecords.map((record, index) => (
                                <div
                                    className="nexus-activity"
                                    key={record.id ?? `${record.title}-${index}`}
                                >
                                    <span
                                        className={`nexus-activity-dot dot-${index}`}
                                    />
                                    <div>
                                        <strong>{record.title}</strong>
                                        <p>{record.description}</p>
                                        <small>
                                            {new Date(record.date).toLocaleString(
                                                'en-IN'
                                            )}
                                            {record.status
                                                ? ` · ${record.status}`
                                                : ''}
                                        </small>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onNavigate?.(record.page)
                                            }
                                        >
                                            Open module
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="nexus-ai-card">
                    <div className="nexus-ai-icon">
                        <BrainCircuit size={24} />
                    </div>
                    <div>
                        <span>WORKFORCE INTELLIGENCE</span>
                        <h2>AI Workforce Insights</h2>
                        <p>
                            Open the workforce insights interface to review
                            available analytics and model integration status.
                        </p>
                        <button
                            type="button"
                            className="hr-button hr-button-secondary"
                            onClick={() => onNavigate?.('AI Workforce Insights')}
                        >
                            Explore insights <ChevronRight size={16} />
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Dashboard