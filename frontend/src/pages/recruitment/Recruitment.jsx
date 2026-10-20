import { useCallback, useEffect, useState } from 'react'
import {
    BriefcaseBusiness,
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    RefreshCw,
} from 'lucide-react'
import { recruitmentApi } from '../../services/api'
import './Recruitment.css'

const emptyForm = {
    title: '',
    department: '',
    location: '',
    employmentType: 'Full-time',
    description: '',
    requirements: '',
    salaryRange: '',
}

function Recruitment() {
    const [jobs, setJobs] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    const loadJobs = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const response = await recruitmentApi.getAll({
                ...(search.trim() ? { search: search.trim() } : {}),
                ...(statusFilter ? { status: statusFilter } : {}),
            })

            setJobs(response.data)
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Could not load job postings. Check that the backend is running.'
            )
        } finally {
            setLoading(false)
        }
    }, [search, statusFilter])

    useEffect(() => {
        loadJobs()
    }, [loadJobs])

    const openCreateForm = () => {
        setForm(emptyForm)
        setEditingId(null)
        setError('')
        setNotice('')
        setShowForm(true)
    }

    const openEditForm = (job) => {
        setForm({
            title: job.title ?? '',
            department: job.department ?? '',
            location: job.location ?? '',
            employmentType: job.employmentType ?? 'Full-time',
            description: job.description ?? '',
            requirements: job.requirements ?? '',
            salaryRange: job.salaryRange ?? '',
        })
        setEditingId(job.id)
        setError('')
        setNotice('')
        setShowForm(true)
    }

    const closeForm = () => {
        setShowForm(false)
        setEditingId(null)
        setForm(emptyForm)
    }

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setSaving(true)
        setError('')
        setNotice('')

        try {
            if (editingId !== null) {
                await recruitmentApi.update(editingId, form)
                setNotice('Job posting updated successfully.')
            } else {
                await recruitmentApi.create(form)
                setNotice('Job posting created successfully.')
            }

            closeForm()
            await loadJobs()
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to save the job posting. Please check your entries.'
            )
        } finally {
            setSaving(false)
        }
    }

    const handleStatusChange = async (job) => {
        const nextStatus = job.status === 'OPEN' ? 'CLOSED' : 'OPEN'
        setError('')
        setNotice('')

        try {
            await recruitmentApi.updateStatus(job.id, nextStatus)
            setNotice(`Job posting ${nextStatus.toLowerCase()} successfully.`)
            await loadJobs()
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Could not update the job status.'
            )
        }
    }

    const handleDelete = async (job) => {
        const confirmed = window.confirm(
            `Delete the job posting "${job.title}"? This cannot be undone.`
        )

        if (!confirmed) return

        setError('')
        setNotice('')

        try {
            await recruitmentApi.delete(job.id)
            setNotice('Job posting deleted successfully.')
            await loadJobs()
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Could not delete the job posting.'
            )
        }
    }

    return (
        <main className="recruitment-page">
            <header className="recruitment-header">
                <div>
                    <h1>Recruitment</h1>
                    <p>Manage job openings and hiring requirements.</p>
                </div>

                <button
                    type="button"
                    className="recruitment-primary-btn"
                    onClick={openCreateForm}
                >
                    <Plus size={18} />
                    Create job
                </button>
            </header>

            {error && (
                <div className="recruitment-alert error" role="alert">
                    {error}
                </div>
            )}

            {notice && (
                <div className="recruitment-alert success" role="status">
                    {notice}
                </div>
            )}

            <section className="recruitment-toolbar">
                <label className="recruitment-search">
                    <Search size={18} />
                    <input
                        type="search"
                        placeholder="Search title, department, or location"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </label>

                <select
                    aria-label="Filter by job status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="">All statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                </select>

                <button
                    type="button"
                    className="recruitment-secondary-btn"
                    onClick={loadJobs}
                    disabled={loading}
                    title="Refresh job postings"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </section>

            {showForm && (
                <section className="recruitment-form-panel">
                    <div className="recruitment-form-heading">
                        <h2>{editingId !== null ? 'Edit job posting' : 'Create job posting'}</h2>
                        <button
                            type="button"
                            className="recruitment-icon-btn"
                            onClick={closeForm}
                            aria-label="Close form"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="recruitment-form-grid">
                            <label>
                                Job title *
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    required
                                    maxLength={150}
                                />
                            </label>

                            <label>
                                Department *
                                <input
                                    name="department"
                                    value={form.department}
                                    onChange={handleChange}
                                    required
                                    maxLength={100}
                                />
                            </label>

                            <label>
                                Location *
                                <input
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    required
                                    maxLength={150}
                                />
                            </label>

                            <label>
                                Employment type *
                                <select
                                    name="employmentType"
                                    value={form.employmentType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Internship">Internship</option>
                                </select>
                            </label>

                            <label>
                                Salary range
                                <input
                                    name="salaryRange"
                                    value={form.salaryRange}
                                    onChange={handleChange}
                                    maxLength={100}
                                />
                            </label>

                            <label className="recruitment-full-width">
                                Job description *
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                />
                            </label>

                            <label className="recruitment-full-width">
                                Requirements
                                <textarea
                                    name="requirements"
                                    value={form.requirements}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </label>
                        </div>

                        <div className="recruitment-form-actions">
                            <button
                                type="button"
                                className="recruitment-secondary-btn"
                                onClick={closeForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="recruitment-primary-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingId !== null
                                        ? 'Save changes'
                                        : 'Create job'}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="recruitment-results">
                <div className="recruitment-results-heading">
                    <h2>Job postings</h2>
                    {!loading && <span>{jobs.length} results</span>}
                </div>

                {loading ? (
                    <div className="recruitment-state">Loading job postings...</div>
                ) : jobs.length === 0 ? (
                    <div className="recruitment-state">
                        <BriefcaseBusiness size={34} />
                        <h3>No job postings found</h3>
                        <p>
                            Create a job posting or change your search and filters.
                        </p>
                    </div>
                ) : (
                    <div className="recruitment-job-list">
                        {jobs.map((job) => (
                            <article className="recruitment-job-card" key={job.id}>
                                <div className="recruitment-job-main">
                                    <div className="recruitment-job-icon">
                                        <BriefcaseBusiness size={22} />
                                    </div>

                                    <div className="recruitment-job-details">
                                        <div className="recruitment-job-title-row">
                                            <h3>{job.title}</h3>
                                            <span
                                                className={`recruitment-status ${
                                                    job.status === 'OPEN' ? 'open' : 'closed'
                                                }`}
                                            >
                                                {job.status}
                                            </span>
                                        </div>

                                        <p>
                                            {job.department} · {job.location} · {job.employmentType}
                                        </p>

                                        {job.salaryRange && (
                                            <p className="recruitment-salary">
                                                {job.salaryRange}
                                            </p>
                                        )}

                                        <p className="recruitment-description">
                                            {job.description}
                                        </p>

                                        {job.requirements && (
                                            <p className="recruitment-requirements">
                                                <strong>Requirements:</strong> {job.requirements}
                                            </p>
                                        )}

                                        {job.postedDate && (
                                            <small>Posted: {job.postedDate}</small>
                                        )}
                                    </div>
                                </div>

                                <div className="recruitment-job-actions">
                                    <button
                                        type="button"
                                        className="recruitment-secondary-btn"
                                        onClick={() => openEditForm(job)}
                                    >
                                        <Pencil size={15} />
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        className="recruitment-secondary-btn"
                                        onClick={() => handleStatusChange(job)}
                                    >
                                        {job.status === 'OPEN' ? 'Close job' : 'Reopen job'}
                                    </button>

                                    <button
                                        type="button"
                                        className="recruitment-danger-btn"
                                        onClick={() => handleDelete(job)}
                                    >
                                        <Trash2 size={15} />
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

export default Recruitment