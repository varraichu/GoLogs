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
import { UserApplicationCard } from './components/UserApplicationCard';
import '../../styles/applications-page.css';

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
}
const UserApplications = (props: { path?: string }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
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
        } finally {
            setIsLoadingPage(false)
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
        <div class="oj-flex oj-sm-flex-direction-column applications-page">
            <div class="oj-flex oj-sm-12 oj-sm-padding-5x-start oj-sm-justify-content-space-between oj-sm-align-items-center oj-sm-padding-5x-end">
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
            <div
                id="applicationsListContainer"
                class="oj-flex-item oj-flex oj-sm-flex-wrap oj-sm-margin-1x-top oj-sm-justify-content-center"
                style="flex: 1; min-height: 0; gap: 16px; position: relative;"
            >

                <div
                    class="oj-flex oj-flex-wrap oj-sm-padding-4x oj-sm-align-items-stretch oj-sm-justify-content-flex-start"
                    style={{
                        gap: '24px',
                    }}
                >
                    {isLoadingPage ? (
                        <oj-c-progress-circle value={-1} size="md" style="margin-top: 40px;" />
                    ) : (

                        applications.length > 0 ? (
                            (applications || []).map((app) => (
                                <UserApplicationCard key={app._id} app={app} />
                            ))) : (<div class="oj-typography-body-md oj-sm-margin-4x">
                                No applications found. Contact administrator for application access.
                            </div>)

                    )}
                </div>

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