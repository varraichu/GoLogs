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
    created_at: string;
    is_active: boolean;
    groupCount: number;
    groupNames: string[];
    logCount: number;
    criticalLogs: CriticalLogs;
    health_status: 'healthy' | 'warning' | 'critical';
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

    public async refreshLogSummary(): Promise<SummaryResponse> {
        const token = localStorage.getItem('jwt');
        const user = this.parseJwt(token);

        if (!user?._id) {
            throw new Error('User not authenticated');
        }

        const endpoint = `${this.baseUrl}/logs/refresh-graph/`

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

    public async fetchApplications(): Promise<{ applications: Application[], userId: string }> {
        const token = localStorage.getItem('jwt');
        const user = this.parseJwt(token);

        if (!user?._id) {
            throw new Error('User not authenticated');
        }

        const { _id: userId, isAdmin } = user;

        let rawApplications: Application[] = [];
        let userPinnedApps: string[] = [];

        if (isAdmin) {
            const [appsRes, userRes] = await Promise.all([
                fetch(`${this.baseUrl}/applications`, {
                    method: 'GET',
                    headers: this.getAuthHeaders(),
                }),
                fetch(`${this.baseUrl}/applications/user/${userId}`, {
                    method: 'GET',
                    headers: this.getAuthHeaders(),
                }),
            ]);

            if (!appsRes.ok || !userRes.ok) {
                throw new Error('Failed to fetch admin data');
            }

            const appsData = await appsRes.json();
            rawApplications = appsData.applications || [];

            const userData = await userRes.json();
            userPinnedApps = userData.pinned_apps.map((id: any) => id.toString());

        } else {
            const res = await fetch(`${this.baseUrl}/applications/${userId}`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch applications');
            }

            rawApplications = data.applications || [];
            userPinnedApps = data.applications
                .filter((app: any) => app.isPinned)
                .map((app: any) => app._id.toString());
        }

        const applicationsWithPinFlag = rawApplications.map(app => ({
            ...app,
            isPinned: userPinnedApps.includes(app._id.toString()),
        }));

        const applications = await this.fetchCriticalLogs(applicationsWithPinFlag);
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
