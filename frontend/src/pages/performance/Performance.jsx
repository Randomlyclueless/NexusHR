
import { useEffect, useMemo, useState } from 'react'
import {
    Search,
    Plus,
    RefreshCw,
    Star,
    Target,
    Users,
    CircleCheck,
    X,
} from 'lucide-react'

import {
    getPerformanceReviews,
    createPerformanceReview,
    updatePerformanceReviewStatus,
} from '../../services/performanceService'

const API_EMPLOYEES = 'http://localhost:8080/api/employees'

function errorMessage(error) {
    return (
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'Something went wrong.'
    )
}

function statusLabel(status) {
    if (status === 'COMPLETED') return 'Completed'
    if (status === 'IN_REVIEW') return 'In Review'
    return 'Draft'
}

function formatRating(value) {
    return Number(value ?? 0).toFixed(1)
}

export default function Performance() {
    const [reviews, setReviews] = useState([])
    const [employees, setEmployees] = useState([])

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [updatingId, setUpdatingId] = useState(null)
    const [showForm, setShowForm] = useState(false)

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const [form, setForm] = useState({
        employeeId: '',
        reviewCycle: '',
        rating: '3',
        goalsTotal: '1',
        goalsCompleted: '0',
        feedback: '',
    })

    async function loadReviews() {
        setLoading(true)
        setError('')

        try {
            const data = await getPerformanceReviews()
            setReviews(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(errorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    async function loadEmployees() {
        try {
            const response = await fetch(API_EMPLOYEES)

            if (!response.ok) {
                throw new Error('Could not load employees.')
            }

            const data = await response.json()
            setEmployees(Array.isArray(data) ? data : [data])
        } catch (err) {
            setError(errorMessage(err))
        }
    }

    useEffect(() => {
        loadReviews()
        loadEmployees()
    }, [])

    const filteredReviews = useMemo(() => {
        const query = search.trim().toLowerCase()

        return reviews.filter((review) => {
            const matchesSearch =
                !query ||
                (review.employeeName ?? '').toLowerCase().includes(query) ||
                (review.department ?? '').toLowerCase().includes(query) ||
                (review.jobTitle ?? '').toLowerCase().includes(query) ||
                (review.reviewCycle ?? '').toLowerCase().includes(query)

            const matchesStatus =
                statusFilter === 'ALL' || review.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [reviews, search, statusFilter])

    const averageRating = useMemo(() => {
        if (!reviews.length) return 0

        return (
            reviews.reduce(
                (total, review) => total + Number(review.rating ?? 0),
                0
            ) / reviews.length
        )
    }, [reviews])

    const goalsTotal = reviews.reduce(
        (total, review) => total + Number(review.goalsTotal ?? 0),
        0
    )

    const goalsCompleted = reviews.reduce(
        (total, review) => total + Number(review.goalsCompleted ?? 0),
        0
    )

    async function handleCreate(event) {
        event.preventDefault()
        setError('')
        setMessage('')

        const rating = Number(form.rating)
        const total = Number(form.goalsTotal)
        const completed = Number(form.goalsCompleted)

        if (!form.employeeId || !form.reviewCycle.trim()) {
            setError('Select an employee and enter a review cycle.')
            return
        }

        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            setError('Rating must be between 1 and 5.')
            return
        }

        if (
            !Number.isInteger(total) ||
            !Number.isInteger(completed) ||
            total < 1 ||
            completed < 0 ||
            completed > total
        ) {
            setError('Enter valid goal counts. Completed goals cannot exceed total goals.')
            return
        }

        setSaving(true)

        try {
            await createPerformanceReview({
                employeeId: Number(form.employeeId),
                reviewCycle: form.reviewCycle.trim(),
                rating,
                goalsTotal: total,
                goalsCompleted: completed,
                feedback: form.feedback.trim(),
            })

            await loadReviews()

            setForm({
                employeeId: '',
                reviewCycle: '',
                rating: '3',
                goalsTotal: '1',
                goalsCompleted: '0',
                feedback: '',
            })

            setShowForm(false)
            setMessage('Performance review created successfully.')
        } catch (err) {
            setError(errorMessage(err))
        } finally {
            setSaving(false)
        }
    }

    async function changeStatus(review, status) {
        setError('')
        setMessage('')
        setUpdatingId(review.id)

        try {
            const updated = await updatePerformanceReviewStatus(
                review.id,
                status
            )

            setReviews((current) =>
                current.map((item) =>
                    item.id === review.id ? updated : item
                )
            )

            setMessage('Review status updated.')
        } catch (err) {
            setError(errorMessage(err))
        } finally {
            setUpdatingId(null)
        }
    }

    function updateField(field, value) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }))
    }

    return (
        <section className="hr-page">
            <div className="hr-page-heading">
                <div>
                    <div className="hr-breadcrumb">
                        Workspace / Performance
                    </div>
                    <h1>Performance Management</h1>
                    <p>
                        Track employee reviews, ratings, goals and feedback.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        className="hr-button"
                        onClick={() => {
                            setError('')
                            setMessage('')
                            setShowForm(true)
                        }}
                    >
                        <Plus size={16} /> Create review
                    </button>

                    <button
                        className="hr-button hr-button-secondary"
                        onClick={() => loadReviews()}
                        disabled={loading}
                        title="Refresh reviews"
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

            {showForm && (
                <div
                    className="hr-panel"
                    style={{ marginBottom: 20, padding: 24 }}
                >
                    <div className="hr-panel-heading">
                        <div>
                            <h2>Create performance review</h2>
                            <p>
                                Record a review for an existing employee.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="employee-modal-close"
                            onClick={() => setShowForm(false)}
                            aria-label="Close review form"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleCreate}>
                        <div
                            className="hr-toolbar"
                            style={{ flexWrap: 'wrap', alignItems: 'stretch' }}
                        >
                            <label style={{ flex: '1 1 220px' }}>
                                Employee
                                <select
                                    className="hr-select"
                                    style={{ width: '100%', marginTop: 8 }}
                                    value={form.employeeId}
                                    onChange={(event) =>
                                        updateField(
                                            'employeeId',
                                            event.target.value
                                        )
                                    }
                                    required
                                >
                                    <option value="">Select employee</option>
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
                                Review cycle
                                <input
                                    className="hr-select"
                                    style={{ width: '100%', marginTop: 8 }}
                                    value={form.reviewCycle}
                                    onChange={(event) =>
                                        updateField(
                                            'reviewCycle',
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Q4 2026"
                                    maxLength={50}
                                    required
                                />
                            </label>

                            <label style={{ flex: '1 1 130px' }}>
                                Rating (1–5)
                                <input
                                    className="hr-select"
                                    style={{ width: '100%', marginTop: 8 }}
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="0.1"
                                    value={form.rating}
                                    onChange={(event) =>
                                        updateField('rating', event.target.value)
                                    }
                                    required
                                />
                            </label>

                            <label style={{ flex: '1 1 130px' }}>
                                Total goals
                                <input
                                    className="hr-select"
                                    style={{ width: '100%', marginTop: 8 }}
                                    type="number"
                                    min="1"
                                    max="1000"
                                    step="1"
                                    value={form.goalsTotal}
                                    onChange={(event) =>
                                        updateField(
                                            'goalsTotal',
                                            event.target.value
                                        )
                                    }
                                    required
                                />
                            </label>

                            <label style={{ flex: '1 1 150px' }}>
                                Completed goals
                                <input
                                    className="hr-select"
                                    style={{ width: '100%', marginTop: 8 }}
                                    type="number"
                                    min="0"
                                    max="1000"
                                    step="1"
                                    value={form.goalsCompleted}
                                    onChange={(event) =>
                                        updateField(
                                            'goalsCompleted',
                                            event.target.value
                                        )
                                    }
                                    required
                                />
                            </label>

                            <label style={{ flex: '1 1 100%' }}>
                                Feedback
                                <textarea
                                    className="hr-select"
                                    style={{
                                        width: '100%',
                                        marginTop: 8,
                                        minHeight: 100,
                                        resize: 'vertical',
                                    }}
                                    value={form.feedback}
                                    onChange={(event) =>
                                        updateField(
                                            'feedback',
                                            event.target.value
                                        )
                                    }
                                    maxLength={3000}
                                    placeholder="Enter review feedback"
                                />
                            </label>
                        </div>

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
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="hr-button"
                                disabled={saving || employees.length === 0}
                            >
                                {saving ? 'Saving...' : 'Save review'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="hr-summary-grid">
                <div className="hr-summary-card">
                    <div className="hr-summary-icon purple">
                        <Users size={20} />
                    </div>
                    <span>Total reviews</span>
                    <strong>{reviews.length}</strong>
                    <small>Stored performance reviews</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon green">
                        <Star size={20} />
                    </div>
                    <span>Average rating</span>
                    <strong>{formatRating(averageRating)} / 5</strong>
                    <small>Across saved reviews</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon orange">
                        <Target size={20} />
                    </div>
                    <span>Goals completed</span>
                    <strong>{goalsCompleted} / {goalsTotal}</strong>
                    <small>Across saved reviews</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon red">
                        <CircleCheck size={20} />
                    </div>
                    <span>Completed reviews</span>
                    <strong>
                        {reviews.filter(
                            (review) => review.status === 'COMPLETED'
                        ).length}
                    </strong>
                    <small>Finalized reviews</small>
                </div>
            </div>

            <div className="hr-panel">
                <div className="hr-panel-heading">
                    <div>
                        <h2>Performance reviews</h2>
                        <p>
                            Reviews and goal progress retrieved from the database.
                        </p>
                    </div>
                </div>

                <div className="hr-toolbar">
                    <label className="hr-search">
                        <Search size={17} />
                        <input
                            type="search"
                            placeholder="Search employee or review cycle..."
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
                        aria-label="Filter by review status"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>

                <div className="hr-table-wrap">
                    <table className="hr-table">
                        <thead>
                        <tr>
                            <th>EMPLOYEE</th>
                            <th>REVIEW CYCLE</th>
                            <th>RATING</th>
                            <th>GOALS</th>
                            <th>FEEDBACK</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="hr-empty">
                                        Loading performance reviews...
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredReviews.map((review) => (
                                <tr key={review.id}>
                                    <td>
                                        <div className="hr-person">
                                            <div className="hr-avatar">
                                                {(review.employeeName ?? '?')
                                                    .split(' ')
                                                    .filter(Boolean)
                                                    .map((part) => part[0])
                                                    .join('')
                                                    .slice(0, 2)}
                                            </div>
                                            <div className="hr-person-text">
                                                <strong>
                                                    {review.employeeName}
                                                </strong>
                                                <small>
                                                    {review.department}
                                                    {review.jobTitle
                                                        ? ` · ${review.jobTitle}`
                                                        : ''}
                                                </small>
                                            </div>
                                        </div>
                                    </td>

                                    <td>{review.reviewCycle}</td>
                                    <td>
                                        <strong>
                                            <Star
                                                size={14}
                                                style={{
                                                    display: 'inline',
                                                    verticalAlign: 'middle',
                                                    marginRight: 4,
                                                }}
                                            />
                                            {formatRating(review.rating)} / 5
                                        </strong>
                                    </td>
                                    <td>
                                        {review.goalsCompleted} / {review.goalsTotal}
                                    </td>
                                    <td>
                                            <span
                                                title={review.feedback || 'No feedback recorded'}
                                            >
                                                {review.feedback
                                                    ? review.feedback.length > 65
                                                        ? `${review.feedback.slice(0, 65)}…`
                                                        : review.feedback
                                                    : 'No feedback'}
                                            </span>
                                    </td>
                                    <td>
                                            <span
                                                className={`hr-status ${
                                                    review.status === 'COMPLETED'
                                                        ? 'approved'
                                                        : 'pending'
                                                }`}
                                            >
                                                <span />
                                                {statusLabel(review.status)}
                                            </span>
                                    </td>
                                    <td>
                                        <select
                                            className="hr-select"
                                            aria-label={`Update status for ${review.employeeName}`}
                                            value={review.status}
                                            disabled={updatingId === review.id}
                                            onChange={(event) =>
                                                changeStatus(
                                                    review,
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="DRAFT">Draft</option>
                                            <option value="IN_REVIEW">In Review</option>
                                            <option value="COMPLETED">Completed</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}

                        {!loading && filteredReviews.length === 0 && (
                            <tr>
                                <td colSpan={7}>
                                    <div className="hr-empty">
                                        {error
                                            ? 'Performance reviews could not be loaded.'
                                            : reviews.length === 0
                                                ? 'No performance reviews exist yet.'
                                                : 'No reviews match your filters.'}
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="hr-table-footer">
                    Showing {filteredReviews.length} of {reviews.length} reviews.
                </div>
            </div>
        </section>
    )
}
