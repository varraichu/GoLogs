// File: src/services/logs.services.ts
import config from '../config/config'
export interface LogEntry {
  _id: string;
  app_id: string;
  app_name: string;
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

export interface SortCriteria {
  attribute: string;
  direction: 'ascending' | 'descending';
}

export interface LogFilters {
  apps: string[];
  logTypes: string[];
  fromDate: string | undefined;
  toDate: string | undefined;
  search: string;
}

class LogsService {
  private baseUrl = `${config.API_BASE_URL}`;

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  /** 🔐 Fetch current authenticated user from cookie */
  private async getUser(): Promise<{ _id: string; isAdmin: boolean }> {
    const res = await fetch(`${this.baseUrl}/oauth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('User not authenticated');
    }

    const data = await res.json();
    return data.user;
  }

  private buildSortQueryString(sortCriteria?: SortCriteria[]): string {
    if (!sortCriteria || sortCriteria.length === 0) return '';
    const sortParams = sortCriteria
      .map(criteria => `${criteria.attribute}:${criteria.direction === 'descending' ? 'desc' : 'asc'}`)
      .join(',');
    return `&sort=${encodeURIComponent(sortParams)}`;
  }

  async fetchLogs(
    page: number,
    limit: number = 10,
    sortCriteria?: SortCriteria[],
    filters?: LogFilters
  ): Promise<LogsResponse> {
    const user = await this.getUser();
    const { _id: userId, isAdmin } = user;

    let baseEndpoint = `${this.baseUrl}/logs`;
    if (!isAdmin) {
      baseEndpoint += `/${userId}`;
    }

    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));

    if (sortCriteria?.length) {
      const sortStr = sortCriteria
        .map(s => `${s.attribute}:${s.direction === 'descending' ? 'desc' : 'asc'}`)
        .join(',');
      params.append('sort', sortStr);
    }

    if (filters?.logTypes?.length) {
      filters.logTypes.forEach(type => params.append('log_type', type));
    }

    if (filters?.apps?.length) {
      filters.apps.forEach(app => params.append('app_name', app));
    }

    if (filters?.fromDate) {
      params.append('startDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params.append('endDate', filters.toDate);
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    const finalUrl = `${baseEndpoint}?${params.toString()}`;

    const res = await fetch(finalUrl, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch logs');
    }

    return data;
  }

  async getExportUrl(
    limit: number = 10,
    filters?: LogFilters,
    sortCriteria?: SortCriteria[]
  ): Promise<string> {
    const user = await this.getUser();
    const { _id: userId, isAdmin } = user;

    // let baseEndpoint = `${this.baseUrl}/logs`;

    // if (!isAdmin) {
    //   baseEndpoint += `/${userId}`;
    // }

    let exportEndpoint = `${this.baseUrl}/logs/export`; // Always use export endpoint
    if (!isAdmin) {
      exportEndpoint += `/${userId}`
    }
    // baseEndpoint += `/${userId}`;

    const params = new URLSearchParams();
    params.append('limit', String(limit));

    if (sortCriteria && sortCriteria.length > 0) {
      const sortStr = sortCriteria
        .map(s => `${s.attribute}:${s.direction === 'descending' ? 'desc' : 'asc'}`)
        .join(',');
      params.append('sort', sortStr);
    }

    if (filters?.logTypes?.length) {
      filters.logTypes.forEach(type => params.append('log_type', type));
    }

    if (filters?.apps?.length) {
      filters.apps.forEach(app => params.append('app_name', app));
    }

    if (filters?.fromDate) {
      params.append('startDate', filters.fromDate);
    }

    if (filters?.toDate) {
      params.append('endDate', filters.toDate);
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    return `${exportEndpoint}?${params.toString()}`;
  }
}

export const logsService = new LogsService();
export default logsService;
