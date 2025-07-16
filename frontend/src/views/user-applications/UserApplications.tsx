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
import '../../styles/applications-page.css';
import { UserApplicationsList } from './components/UserApplicationsList';
import { UserApplicationFilters } from './components/UserApplicationFilters';

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
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [userId, setUserId] = useState("");
    const [opened, setOpened] = useState(false);

    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    const [filters, setFilters] = useState<{ search: string; status: string }>({
        search: '',
        status: 'all',
    });

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 6,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    });

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/oauth/me', {
                    method: 'GET',
                    credentials: 'include', // VERY IMPORTANT: this sends the auth cookie
                });

                if (!res.ok) throw new Error("Not authenticated");

                const data = await res.json();
                setUserId(data.user._id);
            } catch (err) {
                console.error("Failed to fetch user info", err);
            }
        };

        fetchUserId();
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
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
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


    const handleFilterChange = (newFilters: { status: string; }) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPagination(prev => ({ ...prev, page: 1 }));
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

    const toggleDrawer = () => setOpened(!opened);

    return (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-flex-direction-column oj-sm-padding-6x" style="height: 100%; min-height: 0; flex: 1 1 0;">
            <div class="oj-flex oj-sm-12 oj-sm-justify-content-space-between oj-sm-align-items-center">
                <h1 class="oj-typography-heading-md">Applications</h1>
            </div>

            <div class="oj-flex oj-sm-margin-4x-bottom  oj-sm-align-items-center" style="width: 100%; gap: 12px;">
                <SearchBar value={filters.search} onChange={handleSearchChange} placeholder="Search Applications" />
                <oj-button
                    onojAction={toggleDrawer}
                    label={opened ? "Close Filters" : "Apply Filters"}
                    chroming={opened ? "outlined" : "callToAction"}
                >
                    {opened ? (<span slot="startIcon" class="oj-ux-ico-filter-alt-off"></span>) : (<span slot="startIcon" class="oj-ux-ico-filter-alt"></span>)}
                </oj-button>
            </div>

            <oj-drawer-layout endOpened={opened} class="oj-sm-flex-1" style="width: 100%; overflow-x: hidden;">
                <div class="oj-flex oj-sm-flex-1 oj-sm-overflow-hidden" style="min-width: 0;">
                    <div class="oj-flex-item" style="width: 100%;">
                        {isLoadingPage ? (
                            <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" style="height: 400px; width: 100%;">
                                <oj-c-progress-circle value={-1} size="lg" style="margin-top: 40px;" />
                            </div>
                        ) : (
                            <UserApplicationsList applications={applications} />
                        )}

                        {pagination.total > 0 && (
                            <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-flex-end" style="gap: 16px;">
                                <oj-button chroming="callToAction" onojAction={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))} disabled={!pagination.hasPrevPage}>
                                    <span slot="startIcon" class="oj-ux-ico-arrow-left"></span> Previous
                                </oj-button>
                                <span class="oj-typography-body-md oj-text-color-primary">Page {pagination.page} of {pagination.totalPages}</span>
                                <oj-button chroming="callToAction" onojAction={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))} disabled={!pagination.hasNextPage}>
                                    Next <span slot="endIcon" class="oj-ux-ico-arrow-right"></span>
                                </oj-button>
                            </div>
                        )}
                    </div>
                </div>

                <div slot="end" style="width: 280px; max-width: 100%; box-sizing: border-box;">
                    <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center oj-sm-padding-4x-start">
                        <h6>Filter Applications</h6>
                    </div>
                    <UserApplicationFilters onFilterChange={handleFilterChange} />
                </div>
            </oj-drawer-layout>
        </div>
    );
};
export default UserApplications;