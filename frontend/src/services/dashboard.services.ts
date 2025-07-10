// File: src/services/dashboard.service.ts

export interface AppLogSummary {
    _id: string;
    app_id: string;
    app_name: string;
    total: number;
    debug?: number;
    info?: number;
    warn?: number;
    error?: number;
    generated_at: string;
    __v?: number;
}

export interface SummaryResponse {
    message: string;
    data: AppLogSummary[];
}

class DashboardService {
    private baseUrl = 'http://localhost:3001/api';

    private getAuthHeaders() {
        const token = localStorage.getItem('jwt');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    private parseJwt(token: string | null): any {
        if (!token) return null;
        try {
            const base64Payload = token.split('.')[1];
            const jsonPayload = atob(base64Payload);
            return JSON.parse(jsonPayload);
        } catch (err) {
            console.error('Error decoding token', err);
            return null;
        }
    }

    // Inside DashboardService class

    public async fetchLogSummary(): Promise<SummaryResponse> {
        const token = localStorage.getItem('jwt');
        const user = this.parseJwt(token);

        if (!user?._id) {
            throw new Error('User not authenticated');
        }

        const endpoint = user.isAdmin
            ? `${this.baseUrl}/logs/admin-cached-summary/`
            : `${this.baseUrl}/logs/cached-summary/${user._id}`;

        const res = await fetch(endpoint, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Failed to fetch log summary');
        }

        return data;
    }

    // async fetchUserLogSummary(): Promise<SummaryResponse> {
    //     const token = localStorage.getItem('jwt');
    //     const user = this.parseJwt(token);
    //     const userId = user?._id;

    //     if (!userId) {
    //         throw new Error('User not authenticated');
    //     }

    //     const endpoint = `${this.baseUrl}/logs/cached-summary/${userId}`;

    //     const res = await fetch(endpoint, {
    //         method: 'GET',
    //         headers: this.getAuthHeaders(),
    //     });

    //     const data = await res.json();

    //     if (!res.ok) {
    //         throw new Error(data.message || 'Failed to fetch log summary');
    //     }

    //     return data;
    // }

    // async fetchAdminLogSummary(): Promise<SummaryResponse> {

    //     const endpoint = `${this.baseUrl}/logs/admin-cached-summary/`;

    //     const res = await fetch(endpoint, {
    //         method: 'GET',
    //         headers: this.getAuthHeaders(),
    //     });

    //     const data = await res.json();

    //     if (!res.ok) {
    //         throw new Error(data.message || 'Failed to fetch log summary');
    //     }

    //     return data;
    // }
}

export const dashboardService = new DashboardService();
export default dashboardService;