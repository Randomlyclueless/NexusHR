
import axios from 'axios'

const API_URL = 'http://localhost:8080/api/performance'

export async function getPerformanceReviews() {
    const response = await axios.get(API_URL)
    return response.data
}

export async function createPerformanceReview(payload) {
    const response = await axios.post(API_URL, payload)
    return response.data
}

export async function updatePerformanceReviewStatus(id, status) {
    const response = await axios.patch(`${API_URL}/${id}/status`, {
        status,
    })
    return response.data
}
