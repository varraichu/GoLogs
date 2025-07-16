import config from '../config/config';
export interface CriticalAppSummary {
    app_id: string
    app_name: string
    errors: number
    warnings: number
    exceedsError: boolean
    exceedsWarning: boolean
}

export interface SilentAppSummary {
    app_id: string
    app_name: string
    last_seen: string
    minutes_ago: number | 'Never'
}

export interface AppsHealthResponse {
    critical_summary: {
        total_errors: number
        total_warnings: number
        appsExceedingErrorThreshold: CriticalAppSummary[]
        appsExceedingWarningThreshold: CriticalAppSummary[]
    }
    silent_summary: {
        silent_app_count: number
        silent_apps: SilentAppSummary[]
    }
}

export const fetchAppsHealth = async (userId: string): Promise<AppsHealthResponse> => {

    const response = await fetch(`${config.API_BASE_URL}/appsHealth/summary?userId=${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch apps health data')
    }
    return await response.json()
};
