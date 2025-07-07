export interface LogEntry {
    _id: string;
    app_id: string;
    message: string;
    timestamp: string;
    log_type: string;
    ingested_at: string;
}
export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
export interface LogsResponse {
    logs: LogEntry[];
    pagination: Pagination;
    message?: string;
}
declare class LogsService {
    private baseUrl;
    private getAuthHeaders;
    private parseJwt;
    fetchLogs(page: number, limit?: number): Promise<LogsResponse>;
}
export declare const logsService: LogsService;
export default logsService;
