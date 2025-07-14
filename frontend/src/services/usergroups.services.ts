// --- Interfaces (can be moved to a types.ts file) ---
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
const getAuthHeaders = () => {
    const token = localStorage.getItem('jwt');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

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
    const response = await fetch(`http://localhost:3001/api/userGroup/info?${params.toString()}`, { headers: getAuthHeaders() });

    return handleResponse(response);
};

export const fetchDirectoryUsers = async (): Promise<{ value: string; text: string; }[]> => {
    const response = await fetch(`http://localhost:3001/api/directory/search`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    const emails: string[] = data.emails || [];
    return emails.map(email => ({ value: email, text: email }));
};

export const fetchApplications = async (): Promise<Application[]> => {
    const response = await fetch('http://localhost:3001/api/applications', { method: 'GET', headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return Array.isArray(data.applications) ? data.applications : [];
};

export const fetchGroupUsers = async (groupId: string): Promise<User[]> => {
    const response = await fetch(`http://localhost:3001/api/userGroup/${groupId}/users`, { headers: getAuthHeaders() });
    const data = await handleResponse(response);
    return data.users || [];
};

export const saveUserGroup = async (groupData: any, editingGroup: UserGroup | null) => {
    const isEditing = !!editingGroup;
    const url = isEditing ? `http://localhost:3001/api/userGroup/${editingGroup?._id}` : 'http://localhost:3001/api/userGroup/';
    const method = isEditing ? 'PATCH' : 'POST';

    const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(groupData),
    });
    return handleResponse(response);
};

export const updateGroupAppAccess = async (groupId: string, appIds: string[]) => {
    const response = await fetch(`http://localhost:3001/api/userGroup/${groupId}/app-access`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ appIds }),
    });
    return handleResponse(response);
};

export const deleteUserGroup = async (groupId: string) => {
    const response = await fetch(`http://localhost:3001/api/userGroup/${groupId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({ message: 'Failed to delete group.' }));
        throw new Error(data.message);
    }
    return { message: 'Group deleted successfully.' };
};

export const toggleGroupStatus = async (groupId: string, is_active: boolean) => {
    const response = await fetch(`http://localhost:3001/api/userGroup/status/${groupId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active }),
    });
    return handleResponse(response);
};
