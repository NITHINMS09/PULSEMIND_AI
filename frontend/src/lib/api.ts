import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });
        const newToken = data.accessToken;
        localStorage.setItem('accessToken', newToken);
        processQueue(null, newToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  googleAuth: (token: string) => api.post('/auth/google', { token }),
  // Approval workflow
  getPendingUsers: () => api.get('/auth/pending-users'),
  getAllUsers: (params?: Record<string, unknown>) => api.get('/auth/all-users', { params }),
  approveUser: (userId: string) => api.post('/auth/approve-user', { userId }),
  rejectUser: (userId: string, reason?: string) => api.post('/auth/reject-user', { userId, reason }),
  suspendUser: (userId: string, reason?: string) => api.post('/auth/suspend-user', { userId, reason }),
  activateUser: (userId: string) => api.post('/auth/activate-user', { userId }),
};

export const feedbackApi = {
  submit: (data: FormData | Record<string, unknown>) =>
    api.post('/feedback', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }),
  list: (params?: Record<string, unknown>) =>
    api.get('/feedback', { params }),
  getById: (id: string) => api.get(`/feedback/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/feedback/${id}/status`, { status }),
  trackAnonymous: (trackingId: string) =>
    api.get(`/feedback/anonymous/${trackingId}`),
  aiPreview: (content: string) =>
    api.post('/feedback/ai-preview', { content }),
};

export const complaintsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/complaints', { params }),
  getById: (id: string) => api.get(`/complaints/${id}`),
  myComplaints: () => api.get('/complaints/my'),
  kanban: () => api.get('/complaints/kanban'),
  stats: () => api.get('/complaints/stats'),
  assign: (id: string, assigneeId: string) =>
    api.patch(`/complaints/${id}/assign`, { assigneeId }),
  submitSolution: (id: string, solution: string) =>
    api.post(`/complaints/${id}/solution`, { solution }),
  confirmResolution: (id: string, decision: string, comment?: string) =>
    api.post(`/complaints/${id}/confirm`, { decision, comment }),
  resolve: (id: string, note: string) =>
    api.patch(`/complaints/${id}/resolve`, { note }),
  escalate: (id: string) =>
    api.post(`/complaints/${id}/escalate`),
};

export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  departments: () => api.get('/analytics/departments'),
  burnout: () => api.get('/analytics/burnout'),
  emotions: () => api.get('/analytics/emotions'),
  patterns: () => api.get('/analytics/patterns'),
  attrition: () => api.get('/analytics/attrition'),
  predictions: () => api.get('/analytics/predictions'),
  exportReport: (format: 'pdf' | 'excel') =>
    api.post('/analytics/export', { format }, { responseType: 'blob' }),
};

export const adminApi = {
  users: (params?: Record<string, unknown>) =>
    api.get('/admin/users', { params }),
  inviteUser: (data: Record<string, unknown>) =>
    api.post('/admin/users/invite', data),
  updateRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  auditLogs: (params?: Record<string, unknown>) =>
    api.get('/admin/audit-logs', { params }),
  getAiSettings: () => api.get('/admin/ai-settings'),
  updateAiSettings: (data: Record<string, unknown>) =>
    api.patch('/admin/ai-settings', data),
};

export const notificationsApi = {
  list: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  grouped: () => api.get('/notifications/grouped'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  clearAll: () => api.delete('/notifications'),
};

// ============================================
// Phase 2 APIs
// ============================================

export const teamsApi = {
  list: () => api.get('/teams'),
  getById: (id: string) => api.get(`/teams/${id}`),
  create: (data: Record<string, unknown>) => api.post('/teams', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/teams/${id}`, data),
  getComplaints: (id: string, params?: Record<string, unknown>) =>
    api.get(`/teams/${id}/complaints`, { params }),
  addMember: (id: string, userId: string, role?: string) =>
    api.post(`/teams/${id}/members`, { userId, role }),
  removeMember: (id: string, userId: string) =>
    api.delete(`/teams/${id}/members/${userId}`),
  workload: () => api.get('/teams/workload'),
};

export const routingApi = {
  analyze: (text: string, category?: string, priority?: string) =>
    api.post('/routing/analyze', { text, category, priority }),
  test: (text: string) => api.post('/routing/test', { text }),
  listRules: () => api.get('/routing/rules'),
  createRule: (data: Record<string, unknown>) => api.post('/routing/rules', data),
  updateRule: (id: string, data: Record<string, unknown>) =>
    api.put(`/routing/rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`/routing/rules/${id}`),
};

export const slaApi = {
  config: () => api.get('/sla/config'),
  report: () => api.get('/sla/report'),
};

export const escalationApi = {
  escalate: (complaintId: string, reason: string, note?: string) =>
    api.post(`/complaints/${complaintId}/escalate`, { reason, note }),
  getByComplaint: (complaintId: string) =>
    api.get(`/complaints/${complaintId}/escalations`),
  list: (params?: Record<string, unknown>) => api.get('/escalations', { params }),
  analytics: () => api.get('/escalations/analytics'),
};

export const resolutionApi = {
  submitSolution: (complaintId: string, solution: string, note?: string) =>
    api.post(`/complaints/${complaintId}/solution`, { solution, note }),
  confirm: (complaintId: string, data: Record<string, unknown>) =>
    api.post(`/complaints/${complaintId}/confirm`, data),
  getConfirmations: (complaintId: string) =>
    api.get(`/complaints/${complaintId}/confirmations`),
};

export const chatApi = {
  getMessages: (complaintId: string, limit?: number) =>
    api.get(`/complaints/${complaintId}/messages`, { params: { limit } }),
  sendMessage: (complaintId: string, content: string, messageType?: string, replyToId?: string) =>
    api.post(`/complaints/${complaintId}/messages`, { content, messageType, replyToId }),
  markRead: (complaintId: string, messageId: string) =>
    api.patch(`/complaints/${complaintId}/messages/${messageId}/read`),
  deleteMessage: (complaintId: string, messageId: string) =>
    api.delete(`/complaints/${complaintId}/messages/${messageId}`),
  getUnread: (complaintId: string) =>
    api.get(`/complaints/${complaintId}/messages/unread`),
};

export default api;
