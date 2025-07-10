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


export interface CriticalLogs {
  totalLogs: number;
  errorLogs: number;
  warningLogs: number;
}

export interface Application {
  _id: string;
  name: string;
  description: string;
  isPinned: boolean;
  is_active: boolean;
  logCount: number;
  created_at: string;
  criticalLogs: CriticalLogs;
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

    
    public async fetchApplications(): Promise<{ applications: Application[], userId: string }> {
        const token = localStorage.getItem('jwt');
        const user = this.parseJwt(token);

        if (!user?._id) {
        throw new Error('User not authenticated');
        }
        const userId = user._id;

        const res = await fetch(`${this.baseUrl}/applications/${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        });

        const data = await res.json();
        if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch applications');
        }

        const applications = await this.fetchCriticalLogs(data.applications || []);
        return { applications, userId };
    }

    private async fetchCriticalLogs(applications: Application[]): Promise<Application[]> {
        const token = localStorage.getItem('jwt');
        if (!token) return applications;

        const updatedApps = await Promise.all(applications.map(async (app) => {
        try {
            const res = await fetch(`${this.baseUrl}/applications/logs/critical/${app._id}`, {
            headers: this.getAuthHeaders(),
            });

            if (!res.ok) throw new Error(`Failed to fetch logs for app ${app._id}`);

            const criticalLogs = await res.json();
            return {
            ...app,
            criticalLogs: {
                totalLogs: criticalLogs.totalLogs ?? 0,
                errorLogs: criticalLogs.errorLogs ?? 0,
                warningLogs: criticalLogs.warningLogs ?? 0,
            },
            };
        } catch (error) {
            console.error(`Error fetching logs for app ${app._id}:`, error);
            return {
            ...app,
            criticalLogs: { totalLogs: 0, errorLogs: 0, warningLogs: 0 },
            };
        }
        }));

    return updatedApps;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
