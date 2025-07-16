// --- Interfaces (can be moved to a types.ts file) ---
import config from '../config/config'
export interface User {
    _id: string;
    username: string;
    email: string;
    is_active: boolean;
}

export interface Application {
    _id: string;
    name: string;
    is_active: boolean;
}

export interface UserGroup {
    _id: string;
    name: string;
    description: string;
    created_at: string;
    is_active: boolean;
    userCount: number;
    applicationCount: number;
    applicationNames: string[];
    users: User[];
}

// --- Helper for API calls ---

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
};

// --- API Functions ---

export const fetchUserGroups = async (filters: { search: string; status: string; appIds: string[] }, pagination: { page: number; limit: number }) => {
    const params = new URLSearchParams({
        search: filters.search,
        status: filters.status,
        page: String(pagination.page),
        limit: String(pagination.limit),
    });
    // Append appIds as a comma-separated string if the array is not empty
    if (filters.appIds.length > 0) {
        params.append('appIds', filters.appIds.join(','));
    }
    const response = await fetch(`${config.API_BASE_URL}/userGroup/info?${params.toString()}`,
        {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        },
    );

    return handleResponse(response);
};

export const fetchDirectoryUsers = async (): Promise<{ value: string; text: string; }[]> => {
    const response = await fetch(`${config.API_BASE_URL}/directory/search`,
        {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        },
    );
    const data = await handleResponse(response);
    const emails: string[] = data.emails || [];
    return emails.map(email => ({ value: email, text: email }));
};

export const fetchApplications = async (): Promise<Application[]> => {
    const response = await fetch(`${config.API_BASE_URL}/applications`, {
        method: 'GET', credentials: 'include', headers: {
            'Content-Type': 'application/json',
        }
    });
    const data = await handleResponse(response);
    return Array.isArray(data.applications) ? data.applications : [];
};

export const fetchGroupUsers = async (groupId: string): Promise<User[]> => {
    const response = await fetch(`${config.API_BASE_URL}/userGroup/${groupId}/users`, {
        credentials: 'include', headers: {
            'Content-Type': 'application/json',
        }
    });
    const data = await handleResponse(response);
    return data.users || [];
};

export const saveUserGroup = async (groupData: any, editingGroup: UserGroup | null) => {
    const isEditing = !!editingGroup;
    const url = isEditing ? `${config.API_BASE_URL}/userGroup/${editingGroup?._id}` : `${config.API_BASE_URL}/userGroup/`;
    const method = isEditing ? 'PATCH' : 'POST';

    console.log(url)
    console.log(groupData)

    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
    });
    return handleResponse(response);
};

export const updateGroupAppAccess = async (groupId: string, appIds: string[]) => {
    const response = await fetch(`${config.API_BASE_URL}/userGroup/${groupId}/app-access`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ appIds }),
    });
    return handleResponse(response);
};

export const deleteUserGroup = async (groupId: string) => {
    const response = await fetch(`${config.API_BASE_URL}/userGroup/${groupId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete group.' }));
        throw new Error(data.message);
    }
    return { message: 'Group deleted successfully.' };
};

export const toggleGroupStatus = async (groupId: string, is_active: boolean) => {
    const response = await fetch(`${config.API_BASE_URL}/userGroup/status/${groupId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active }),
    });
    return handleResponse(response);
};
