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
    sortCriteria?: SortCriteria[]
  ): Promise<LogsResponse> {
    const token = localStorage.getItem('jwt');
    const user = this.parseJwt(token);
    const isAdmin = user?.isAdmin;
    const userId = user?._id;

    const sortQuery = this.buildSortQueryString(sortCriteria);
    
    const endpoint = isAdmin
      ? `${this.baseUrl}/logs?page=${page}&limit=${limit}${sortQuery}`
      : `${this.baseUrl}/logs/${userId}?page=${page}&limit=${limit}${sortQuery}`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch logs');
    }

    return data;
  }
}

export const logsService = new LogsService();
export default logsService;