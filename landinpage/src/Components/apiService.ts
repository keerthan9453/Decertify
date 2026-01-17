// apiService.ts - Centralized API calls

const API_BASE = 'http://localhost:8000';

const getToken = () => localStorage.getItem('token');

export const apiCall = async (
    endpoint: string,
    method = 'GET',
    body: any = null
) => {
    const token = getToken();
    const headers: any = { 'Authorization': `Bearer ${token}` };
    const options: RequestInit = { method, headers };

    if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
        options.body = body;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (response.status === 401) {
        throw new Error('SESSION_EXPIRED');
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Request failed');
    }

    return response.json();
};

export const sessionAPI = {
    fetchSessions: () => apiCall('/sessions', 'GET'),

    fetchFullResults: (sessionId: string) =>
        apiCall(`/sessions/${sessionId}/full-results`, 'GET'),

    joinNetwork: () => apiCall('/sessions/join', 'POST'),

    leaveNetwork: () => apiCall('/sessions/leave', 'POST'),

    startSession: (formData: FormData) =>
        apiCall('/sessions/start', 'POST', formData),
};