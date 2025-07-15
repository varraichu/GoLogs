export interface Application {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  is_active: boolean;
  isPinned: boolean;
  groupCount: number;
  groupNames: string[];
  logCount: number;
  health_status: 'healthy' | 'warning' | 'critical';
}

export interface UserGroup {
  _id: string
  name: string
  description: string
  created_at: string
  is_deleted: boolean
  is_active: boolean
}

export interface CreateApplicationData {
  name: string
  description: string
}

export interface UpdateApplicationData {
  name: string
  description: string
}

export interface ApplicationsResponse {
  applications: Application[]
  message?: string
}

export interface UserGroupsResponse {
  groupIds: string[]
  message?: string
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApplicationsResponse {
  applications: Application[];
  pagination?: Pagination;
  message?: string;
}

class ApplicationsService {
  private baseUrl = 'http://localhost:3001/api'

  private getHeaders() {

    return {
      'Content-Type': 'application/json',
    }
  }

  private async getUserIdFromSession(): Promise<string | null> {
    try {
      const res = await fetch('http://localhost:3001/api/oauth/me', {
        method: 'GET',
        credentials: 'include', // 🔐 Ensures cookies are sent with the request
      });

      if (!res.ok) {
        console.error('Failed to fetch user info');
        return null;
      }

      const data = await res.json();
      return data.user?._id || null;
    } catch (err) {
      console.error('Error fetching user session:', err);
      return null;
    }
  }

  /**
   * Fetch all applications
   */
  async fetchApplications(
    filters: { search?: string; groupIds?: string[]; status?: string },
    pagination: { page: number; limit: number }
  ): Promise<ApplicationsResponse> {

    const params = new URLSearchParams();

    // Pagination
    params.append('page', String(pagination.page));
    params.append('limit', String(pagination.limit));

    // Filters
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.groupIds && filters.groupIds.length > 0) {
      params.append('groupIds', Array.from(filters.groupIds).join(','));
    }

    console.log('1')
    const response = await fetch(`${this.baseUrl}/applications/?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(),

    });

    console.log('2')

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch applications');
    }

    return data;
  }

  async fetchUserApplications(): Promise<ApplicationsResponse> {
    const userId = await this.getUserIdFromSession();
    if (!userId) {
      throw new Error('User ID not found in token');
    }

    const response = await fetch(`${this.baseUrl}/applications/${userId}`, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user applications');
    }

    return data;
  }

  async fetchApplicationsByRole(
    filters: { search?: string; groupIds?: string[]; status?: string },
    pagination: { page: number; limit: number }
  ): Promise<ApplicationsResponse> {
    const res = await fetch('http://localhost:3001/api/oauth/me', {
      method: 'GET',
      credentials: 'include', // 🔐 Ensures cookies are sent with the request
    });

    const data = await res.json();

    try {

      if (data.user.isAdmin) {
        return await this.fetchApplications(filters, pagination);
      } else {
        return await this.fetchUserApplications();
      }
    } catch (err) {
      console.error('Error decoding JWT or fetching applications:', err);
      throw new Error('Failed to fetch applications based on user role');
    }
  }

  /**
   * Create a new application
   */
  async createApplication(applicationData: CreateApplicationData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/applications/`, {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(applicationData),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create application')
    }

    // return data
    return response
  }

  /**
   * Update an existing application
   */
  async updateApplication(appId: string, applicationData: UpdateApplicationData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/applications/${appId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(applicationData),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update application')
    }

    // return data
    return response
  }

  /**
   * Delete an application
   */
  async deleteApplication(appId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/applications/${appId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders(),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete application')
    }

    return response
  }

  /**
   * Toggle application status (active/inactive)
   */
  async toggleApplicationStatus(appId: string, isActive: boolean): Promise<any> {
    const response = await fetch(`${this.baseUrl}/applications/status/${appId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ is_active: isActive }),
    })

    if (!response.ok) {
      throw new Error('Failed to toggle application status')
    }

    return response;
  }

  /**
   * Fetch all user groups
   */
  async fetchAllUserGroups(): Promise<UserGroup[]> {
    const response = await fetch(`${this.baseUrl}/userGroup/`, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user groups')
    }

    return data
  }

  /**
   * Fetch user groups assigned to a specific application
   */
  async fetchAppUserGroups(appId: string): Promise<UserGroupsResponse> {
    const response = await fetch(`${this.baseUrl}/assignGroup/${appId}/user-groups`, {
      method: 'GET',
      credentials: 'include',
      headers: this.getHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch application user groups')
    }

    return data
  }

  /**
   * Unassign a user group from an application
   */
  async unassignUserGroup(appId: string, groupId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/assignGroup/${appId}/user-groups/${groupId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error('Failed to unassign user group')
    }
  }

  /**
   * Assign user groups to an application
   */
  async assignUserGroups(appId: string, groupIds: string[]): Promise<void> {
    if (groupIds.length === 0) return

    const response = await fetch(`${this.baseUrl}/assignGroup/${appId}/user-groups`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ groupIds }),
    })

    if (!response.ok) {
      throw new Error('Failed to assign user groups')
    }
  }

  /**
   * Update user group assignments for an application
   * This method handles both unassigning old groups and assigning new ones
   */
  async updateUserGroupAssignments(
    appId: string,
    previousGroupIds: string[],
    newGroupIds: string[]
  ): Promise<void> {
    // First, unassign all previous groups
    await Promise.all(
      previousGroupIds.map(groupId => this.unassignUserGroup(appId, groupId))
    )

    // Then assign new groups
    await this.assignUserGroups(appId, newGroupIds)
  }
}

// Export a singleton instance
export const applicationsService = new ApplicationsService()
export default applicationsService