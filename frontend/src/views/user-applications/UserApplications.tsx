// File: src/pages/Applications.tsx
import { h } from 'preact';
import { useEffect, useRef, useState, useMemo } from "preact/hooks";
import 'ojs/ojdialog';
import 'ojs/ojswitch';
import "oj-c/button";
import "oj-c/input-text";
import "oj-c/form-layout";
import 'oj-c/select-multiple';
import 'oj-c/progress-circle';
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

    const fetchApplications = async () => {
        setIsLoadingPage(true);
        try {
            const token = localStorage.getItem('jwt');
            if (token) {
                try {
                    const base64Payload = token.split('.')[1];
                    const payload = JSON.parse(atob(base64Payload));

                    const userId = payload._id;
                    console.log('User Id from token:', userId);
                    setUserId(userId);

                    const res = await fetch(`http://localhost:3001/api/applications/${userId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        }
                    });
                    const data = await res.json();
                    console.log("API Response:", data);
                    setApplications(data.applications || []);
                    // console.log("Fetched: ", applications);
                } catch (err) {
                    console.error('Failed to fetch applications:', err);
                }

            } else {
                console.warn('JWT token not found in localStorage');
            }

        } catch (error) {
            console.error("Failed to fetch applications", error);
        } finally {
            setIsLoadingPage(false)
        }
    };

    return (
        <div class="oj-flex oj-sm-flex-direction-column applications-page">
            <div class="oj-flex oj-sm-12 oj-sm-padding-5x-start oj-sm-justify-content-space-between oj-sm-align-items-center oj-sm-padding-5x-end">
                <h1 class="oj-typography-heading-md">Applications</h1>
            </div>

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
        </div>
    );
};
export default UserApplications;