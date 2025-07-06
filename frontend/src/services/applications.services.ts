// File: src/services/applications.services.ts

export interface Application {
  _id: string
  name: string
  description: string
  created_at: string
  is_active: boolean
  groupCount: number
  groupNames: string[]
  logCount: number
}

export interface UserGroup {
  _id: string
  name: string
  description: string
  created_at: string
  is_deleted: boolean
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

class ApplicationsService {
  private baseUrl = 'http://localhost:3001/api'

  private getAuthHeaders() {
    const token = localStorage.getItem('jwt')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Fetch all applications
   */
  async fetchApplications(): Promise<ApplicationsResponse> {
    const response = await fetch(`${this.baseUrl}/applications/`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch applications')
    }

    return data
  }

  /**
   * Create a new application
   */
  async createApplication(applicationData: CreateApplicationData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/applications/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
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
      headers: this.getAuthHeaders(),
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
      headers: this.getAuthHeaders(),
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
      headers: this.getAuthHeaders(),
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
      headers: this.getAuthHeaders(),
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
      headers: this.getAuthHeaders(),
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
      headers: this.getAuthHeaders(),
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
      headers: this.getAuthHeaders(),
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