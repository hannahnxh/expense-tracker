const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch (_) {}
    throw new Error(detail)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // Categories
  getCategories: () => request('/api/categories'),
  createCategory: (data) => request('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/transactions${qs ? `?${qs}` : ''}`)
  },
  createTransaction: (data) => request('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/api/transactions/${id}`, { method: 'DELETE' }),

  // Subscriptions
  getSubscriptions: (activeOnly = false) => request(`/api/subscriptions${activeOnly ? '?active_only=true' : ''}`),
  getSubscriptionsSummary: () => request('/api/subscriptions/summary'),
  createSubscription: (data) => request('/api/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscription: (id, data) => request(`/api/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubscription: (id) => request(`/api/subscriptions/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardSummary: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/dashboard/summary${qs ? `?${qs}` : ''}`)
  },
}
