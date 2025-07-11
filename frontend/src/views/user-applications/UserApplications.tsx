// File: src/pages/Applications.tsx
import { h } from 'preact';
import { useEffect, useRef, useState, useMemo } from "preact/hooks";
import 'ojs/ojdialog';
import 'ojs/ojswitch';
import "oj-c/button";
import "oj-c/input-text";
import "oj-c/form-layout";
import 'oj-c/select-multiple';
import 'oj-c/select-single'; 

import ArrayDataProvider = require('ojs/ojarraydataprovider');
import SearchBar from '../../components/SearchBar'; 

const getHealthStatusColor = (status: string) => {
    switch (status) {
        case 'critical':
            return { background: '#fde8e8', text: '#991b1b', border: '#fecaca' };
        case 'warning':
            return { background: '#fffbeb', text: '#b45309', border: '#fde68a' };
        case 'healthy':
        default:
            return { background: '#eafaf1', text: '#065f46', border: '#a7f3d0' };
    }
};

interface Application {
    _id: string;
    name: string;
    description: string;
    created_at: string;
    is_active: boolean;
    groupCount: number;
    groupNames: string[];
    logCount: number;
    isPinned: boolean;
    health_status: 'healthy' | 'warning' | 'critical';
}

const UserApplications = (props: { path?: string }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [userId, setUserId] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

     const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [filters, setFilters] = useState<{ search: string; status: string }>({
        search: '',
        status: 'all',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 4, 
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    });

    useEffect(() => {
        const token = localStorage.getItem('jwt');
        if (token) {
            try {
                const base64Payload = token.split('.')[1];
                const payload = JSON.parse(atob(base64Payload));
                setUserId(payload._id || null);
            } catch (e) {
                console.error("Error decoding JWT:", e);
            }
        }
    }, []);

    useEffect(() => {
        if (userId) {
            fetchApplications();
        }
    }, [userId, filters, pagination.page]);

    const fetchApplications = async () => {
        if (!userId) return;

        try {
            const token = localStorage.getItem('jwt');
            if (!token) {
                console.warn('JWT token not found');
                return;
            }

            const params = new URLSearchParams({
                page: String(pagination.page),
                limit: String(pagination.limit),
            });
            if (filters.search) {
                params.append('search', filters.search);
            }
            if (filters.status && filters.status !== 'all') {
                params.append('status', filters.status);
            }

            const res = await fetch(`http://localhost:3001/api/applications/${userId}?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await res.json();
            setApplications(data.applications || []);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch applications", error);
        }
    };

    const handleSearchChange = (newSearchTerm: string) => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: newSearchTerm.trim() }));
            setPagination(prev => ({ ...prev, page: 1 })); 
        }, 300);
    };

    const handleStatusChange = (event: CustomEvent) => {
        const newStatus = event.detail.value || 'all';
        setFilters(prev => ({ ...prev, status: newStatus }));
        setPagination(prev => ({ ...prev, page: 1 })); 
    };

    const statusOptions = useMemo(() => {
        return new ArrayDataProvider([
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
        ], { keyAttributes: 'value' });
    }, []);

return (
    <div class="oj-flex oj-sm-flex-direction-column oj-sm-padding-4x-horizontal" style="width: 100%;">

            <div class="oj-flex oj-sm-12 oj-sm-padding-2x-start oj-sm-justify-content-space-between oj-sm-align-items-center oj-sm-padding-5x-end">
                <h1 class="oj-typography-heading-md">Applications</h1>
            </div>

        <div class="oj-flex oj-sm-align-items-center oj-sm-flex-wrap" style=" margin-bottom: 24px;  margin-left: -10px;">
            <div style="width: 250px;">
                <SearchBar 
                    value={filters.search} 
                    onChange={handleSearchChange} 
                    placeholder="Search Applications"
                />
            </div>
            <oj-c-select-single
                style="width: 150px; height: 2.375rem; margin-top: -8px;  margin-left: -4px;"
                labelHint="Status"
                data={statusOptions}
                onvalueChanged={handleStatusChange}
                value={filters.status}
                item-text="label"
            ></oj-c-select-single>
        </div>

            {/* Application Cards */}
            <div class="oj-flex oj-flex-wrap" style={"gap: 24px;"}>
                {applications.length > 0 ? (
                    applications.map((app) => {
                        // Define healthColor for each app inside the loop
                        const healthColor = getHealthStatusColor(app.health_status);
                        
                        return (
                        <div 
                            key={app._id} 
                            class="oj-panel oj-panel-shadow-md" 
                            style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px 20px 16px 20px; max-width: 400px; min-width: 400px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;"
                        >
                            {/* Card content */}
                            <div>
                                <div class="oj-flex" style="align-items: flex-start; justify-content: space-between; margin-bottom: 8px;">
    {/* This new div will align the name and badge horizontally */}
    <div class="oj-flex oj-sm-align-items-center" style="gap: 0.5rem;">
                                        
                                        <h3 class="oj-typography-heading-sm" style="margin: 0; flex: 1; word-break: break-word;">
                                            {app.name}
                                            {app.isPinned && (<span class="oj-ux-ico-pin-filled" style="color: #4CAF50; margin-left: 8px;" title="Pinned application"></span>)}
                                        </h3>
                                        {/* 3. Add the Health Status badge */}
                                            <span class="oj-typography-body-xs" style={{ padding: '2px 8px', borderRadius: '12px', fontWeight: 500, backgroundColor: healthColor.background, color: healthColor.text, border: `1px solid ${healthColor.border}`, textTransform: 'capitalize', alignSelf: 'flex-start', marginTop: '8px' }}>
                                                {app.health_status}
                                            </span>
                                        </div>

                                        <span class="oj-typography-body-xs" style={`margin-left: 12px; padding: 2px 10px; font-weight: 500; marginTop: '10px'; color: ${app.is_active ? '#065f46' : '#991b1b'}; font-size: 0.85em;`}>
                                            {app.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x" style="overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                    {app.description}
                                </p>
                                <div class="oj-flex" style="justify-content: space-between; align-items: stretch; gap: 32px; margin-bottom: 24px;">
                                    <div style="display: flex; flex-direction: column; align-items: flex-start; background-color: rgba(243, 243, 243, 0.6); padding: 8px; border-radius: 8px; flex: 1;">
                                        <div class="oj-typography-body-sm oj-text-color-secondary">Logs</div>
                                        <div class="oj-typography-heading-md">{app.logCount.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="oj-flex" style="justify-content: space-between; align-items: center; gap: 12px; margin-top: auto;">
                                <div class="oj-typography-body-xs oj-text-color-secondary">
                                    Created {new Date(app.created_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                        );
                    })
                ) : (
                    <div class="oj-typography-body-md oj-sm-margin-4x">
                        No applications found with the current filters.
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.total > 0 && (
                <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-flex-end" style="gap: 16px; margin-top: 24px; padding: 16px 0;">
                    <oj-button
                        chroming="callToAction"
                        onojAction={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={!pagination.hasPrevPage}
                    >
                        <span slot="startIcon" class="oj-ux-ico-arrow-left"></span>
                        Previous
                    </oj-button>
                    <span class="oj-typography-body-md oj-text-color-primary">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <oj-button
                        chroming="callToAction"
                        onojAction={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={!pagination.hasNextPage}
                    >
                        Next
                        <span slot="endIcon" class="oj-ux-ico-arrow-right"></span>
                    </oj-button>
                </div>
            )}
        </div>
    
);
};
export default UserApplications;