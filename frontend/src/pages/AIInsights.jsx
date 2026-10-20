import { useEffect, useState } from 'react'
import {
    BrainCircuit,
    Users,
    TrendingUp,
    CalendarDays,
} from 'lucide-react'
import api, { aiInsightsApi } from '../services/api.js'

export default function AIInsights() {
    const [employeeCount, setEmployeeCount] = useState(null)
    const [employeeError, setEmployeeError] = useState(false)
    const [aiHealth, setAiHealth] = useState(null)
    const [aiError, setAiError] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function loadInsights() {
            const results = await Promise.allSettled([
                api.get('/employees'),
                aiInsightsApi.getHealth(),
            ])

            if (cancelled) return

            const employeeResult = results[0]
            const aiResult = results[1]

            if (employeeResult.status === 'fulfilled') {
                const data = employeeResult.value.data
                const records = Array.isArray(data)
                    ? data
                    : data?.content ?? data?.data ?? []

                setEmployeeCount(records.length)
                setEmployeeError(false)
            } else {
                setEmployeeError(true)
            }

            if (aiResult.status === 'fulfilled') {
                setAiHealth(aiResult.value.data)
                setAiError(false)
            } else {
                setAiHealth(null)
                setAiError(true)
            }
        }

        loadInsights()

        return () => {
            cancelled = true
        }
    }, [])

    const modelAvailable = aiHealth?.model_available === true
    const serviceAvailable = aiHealth?.status === 'ok'

    return (
        <section className="hr-page">
            <div className="hr-page-heading">
                <div>
                    <div className="hr-breadcrumb">
                        Workspace / AI Workforce Insights
                    </div>
                    <h1>AI Workforce Insights</h1>
                    <p>Workforce trends and employee attrition intelligence.</p>
                </div>
            </div>

            <div className="hr-summary-grid">
                <div className="hr-summary-card">
                    <div className="hr-summary-icon purple">
                        <BrainCircuit size={20} />
                    </div>
                    <span>Prediction engine</span>
                    <strong>
                        {aiError
                            ? 'Unavailable'
                            : !aiHealth
                                ? 'Checking...'
                                : modelAvailable
                                    ? 'Model available'
                                    : 'Model unavailable'}
                    </strong>
                    <small>
                        {aiError
                            ? 'Could not connect to the AI backend'
                            : aiHealth?.message ?? 'Checking AI service status'}
                    </small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon orange">
                        <Users size={20} />
                    </div>
                    <span>Employees monitored</span>
                    <strong>
                        {employeeError
                            ? 'Unavailable'
                            : employeeCount ?? 'Loading...'}
                    </strong>
                    <small>Employee records returned by the API</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon green">
                        <TrendingUp size={20} />
                    </div>
                    <span>AI service status</span>
                    <strong>
                        {aiError
                            ? 'Connection failed'
                            : !aiHealth
                                ? 'Checking...'
                                : serviceAvailable
                                    ? 'Online'
                                    : 'Unavailable'}
                    </strong>
                    <small>Live status from the Python AI service</small>
                </div>

                <div className="hr-summary-card">
                    <div className="hr-summary-icon blue">
                        <CalendarDays size={20} />
                    </div>
                    <span>Last analysis</span>
                    <strong>Not run</strong>
                    <small>No organization-specific analysis has been run</small>
                </div>
            </div>

            <div className="hr-panel">
                <div className="hr-panel-heading">
                    <div>
                        <h2>Attrition prediction</h2>
                        <p>
                            The trained model is available, but organization-specific
                            employee predictions are not yet enabled.
                        </p>
                    </div>
                </div>

                <div className="nexus-insights-empty">
                    <div className="hr-summary-icon purple">
                        <BrainCircuit size={25} />
                    </div>
                    <h2>
                        {modelAvailable
                            ? 'AI model connected successfully'
                            : 'AI model is not currently available'}
                    </h2>
                    <p>
                        {modelAvailable
                            ? 'The model was trained on a public HR dataset. Predictions for your employees require the necessary input features and organization-specific validation.'
                            : aiError
                                ? 'The AI service could not be reached. Check that the Python service is running.'
                                : 'A valid trained model is required before analysis can run.'}
                    </p>
                </div>
            </div>
        </section>
    )
}