// File: src/services/logs.services.ts

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

export interface SortCriteria {
  attribute: string;
  direction: 'ascending' | 'descending';
}

export interface LogFilters {
  apps: string[];            // Optional: multiple app IDs (you can use the first one)
  logTypes: string[];        // e.g. ["debug", "error"]
  fromDate: string | undefined;   // ISO date string
  toDate: string | undefined;     // ISO date string
  search: string;
}

class LogsService {
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

  private buildSortQueryString(sortCriteria?: SortCriteria[]): string {
    if (!sortCriteria || sortCriteria.length === 0) {
      return '';
    }

    // Convert sort criteria to query parameters
    // Format: &sort=timestamp:desc,log_type:desc,app_name:desc
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
    const token = localStorage.getItem('jwt');
    const user = this.parseJwt(token);
    const isAdmin = user?.isAdmin;
    const userId = user?._id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Set base endpoint
    let baseEndpoint = `${this.baseUrl}/logs`;

    // If non-admin, use user-specific route
    if (!isAdmin) {
      baseEndpoint += `/${userId}`;
    }

    const params = new URLSearchParams();

    // Pagination
    params.append('page', String(page));
    params.append('limit', String(limit));

    // Sorting
    if (sortCriteria && sortCriteria.length > 0) {
      const sortStr = sortCriteria
        .map(s => `${s.attribute}:${s.direction === 'descending' ? 'desc' : 'asc'}`)
        .join(',');
      params.append('sort', sortStr);
    }

    // Filters — allow multiple
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
      headers: this.getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch logs');
    }

    return data;
  }
  getExportUrl(
    limit: number = 10,
    filters?: LogFilters,
    sortCriteria?: SortCriteria[]
  ): string {
    const token = localStorage.getItem('jwt');
    const user = this.parseJwt(token);
    const isAdmin = user?.isAdmin;
    const userId = user?._id;

    // let baseEndpoint = `${this.baseUrl}/logs`;

    // if (!isAdmin) {
    //   baseEndpoint += `/${userId}`;
    // }
    
    let exportEndpoint = `${this.baseUrl}/logs/export`; // Always use export endpoint
    if (!isAdmin){
      exportEndpoint+=`/${userId}`
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