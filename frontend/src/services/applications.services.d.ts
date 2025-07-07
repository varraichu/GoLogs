export interface Application {
    _id: string;
    name: string;
    description: string;
    created_at: string;
    is_active: boolean;
    groupCount: number;
    groupNames: string[];
    logCount: number;
}
export interface UserGroup {
    _id: string;
    name: string;
    description: string;
    created_at: string;
    is_deleted: boolean;
}
export interface CreateApplicationData {
    name: string;
    description: string;
}
export interface UpdateApplicationData {
    name: string;
    description: string;
}
export interface ApplicationsResponse {
    applications: Application[];
    message?: string;
}
export interface UserGroupsResponse {
    groupIds: string[];
    message?: string;
}
declare class ApplicationsService {
    private baseUrl;
    private getAuthHeaders;
    fetchApplications(): Promise<ApplicationsResponse>;
    createApplication(applicationData: CreateApplicationData): Promise<any>;
    updateApplication(appId: string, applicationData: UpdateApplicationData): Promise<any>;
    deleteApplication(appId: string): Promise<any>;
    toggleApplicationStatus(appId: string, isActive: boolean): Promise<any>;
    fetchAllUserGroups(): Promise<UserGroup[]>;
    fetchAppUserGroups(appId: string): Promise<UserGroupsResponse>;
    unassignUserGroup(appId: string, groupId: string): Promise<void>;
    assignUserGroups(appId: string, groupIds: string[]): Promise<void>;
    updateUserGroupAssignments(appId: string, previousGroupIds: string[], newGroupIds: string[]): Promise<void>;
}
export declare const applicationsService: ApplicationsService;
export default applicationsService;
