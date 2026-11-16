import apiClient from './api'

/**
 * Referral Service - API client for referral operations
 */
export const ReferralListClient = {
  async list(params = {}) {
    const response = await apiClient.get('/referrals', { params })
    return response.data
  },

  async get(id) {
    const response = await apiClient.get(`/referrals/${id}`)
    return response.data
  },

  async create(data) {
    const response = await apiClient.post('/referrals', data)
    return response.data
  },

  async update(id, data) {
    const response = await apiClient.patch(`/referrals/${id}`, data)
    return response.data
  },

  async delete(id) {
    const response = await apiClient.delete(`/referrals/${id}`)
    return response.data
  },
}

export const ReferralDetailsClient = {
  async get(id) {
    const response = await apiClient.get(`/referrals/${id}`)
    return response.data
  },

  async checkClosure(id) {
    const response = await apiClient.get(`/referrals/${id}/closure-check`)
    return response.data
  },

  async close(id) {
    const response = await apiClient.post(`/referrals/${id}/close`)
    return response.data
  },
}

export const HospitalClient = {
  async acknowledge(id) {
    const response = await apiClient.post(`/hospital/intake/${id}/acknowledge`)
    return response.data
  },

  async recordArrival(id, data) {
    const response = await apiClient.post(`/hospital/intake/${id}/arrive`, data)
    return response.data
  },

  async recordOutcome(id, data) {
    const response = await apiClient.post(`/hospital/outcomes/${id}`, data)
    return response.data
  },

  async createBackReferral(id, data) {
    const response = await apiClient.post(`/hospital/back-referrals/${id}`, data)
    return response.data
  },
}

export const FollowUpClient = {
  async list(params = {}) {
    const response = await apiClient.get('/follow-ups', { params })
    return response.data
  },

  async create(data) {
    const response = await apiClient.post('/follow-ups', data)
    return response.data
  },

  async update(id, data) {
    const response = await apiClient.patch(`/follow-ups/${id}`, data)
    return response.data
  },
}

export const SupervisorClient = {
  async getAnalytics() {
    const response = await apiClient.get('/supervisor/analytics')
    return response.data
  },

  async getOverdue() {
    const response = await apiClient.get('/supervisor/overdue')
    return response.data
  },

  async getMetrics(params = {}) {
    const response = await apiClient.get('/supervisor/metrics', { params })
    return response.data
  },
}

export default {
  ReferralListClient,
  ReferralDetailsClient,
  HospitalClient,
  FollowUpClient,
  SupervisorClient,
}