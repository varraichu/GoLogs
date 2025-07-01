declare const API: Axios.AxiosInstance;
export declare const fetchGroups: () => Axios.IPromise<Axios.AxiosXHR<unknown>>;
export declare const fetchApplications: () => Axios.IPromise<Axios.AxiosXHR<unknown>>;
export declare const fetchGroupApplications: (groupId: string) => Axios.IPromise<Axios.AxiosXHR<unknown>>;
export declare const updateGroupApplications: (groupId: string, appIds: string[]) => Axios.IPromise<Axios.AxiosXHR<unknown>>;
export default API;
