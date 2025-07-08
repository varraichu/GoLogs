// File: src/pages/Applications.tsx
import { h } from 'preact';
import { useEffect, useRef, useState, useMemo } from "preact/hooks";
import 'ojs/ojdialog';
import 'ojs/ojswitch';
import "oj-c/button";
import "oj-c/input-text";
import "oj-c/form-layout";
import 'oj-c/select-multiple';
import LengthValidator = require('ojs/ojvalidator-length');
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider')

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

interface JwtPayload {
  _id: string;
  // Add other expected properties from your JWT payload
  [key: string]: any; // For any additional properties
}

interface UserApplicationsProps {
    path?: string;  // Define the path prop type
}

const UserApplications = (props: { path?: string }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [userId, setUserId] = useState("");
    const [isToggling, setIsToggling] = useState(false); 


    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem('jwt');
            if (token) {
                try {
                    const base64Payload = token.split('.')[1]; // Get the payload part
                    const payload = JSON.parse(atob(base64Payload)); // Decode from base64

                    const userId = payload._id;
                    console.log('User Id from token:', userId);
                    setUserId(userId); // Set the userId here

                    const res = await fetch(`http://localhost:3001/api/applications/${userId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        }
                    });
                    const data = await res.json();
                    console.log("API Response:", data); // Debug the actual response
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
        }
    };


// const handleTogglePin = async (appId: string) => {
//     console.log('handleTogglePin called with appId:', appId); // Debug log
//     try {
//         const token = localStorage.getItem('jwt');
//         if (!token || !userId) {
//             console.error('Missing token or userId');
//             return;
//         }

//         const app = applications.find(a => a._id === appId);
//         if (!app) {
//             console.error('Application not found');
//             return;
//         }

//         const endpoint = app.isPinned 
//             ? `http://localhost:3001/api/applications/unpin/${userId}/${appId}`
//             : `http://localhost:3001/api/applications/pin/${userId}/${appId}`;

//         console.log('Endpoint:', endpoint); // Debug log

//         const res = await fetch(endpoint, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json',
//             },
//         });

//         console.log('API response status:', res.status); // Debug log

//         if (!res.ok) {
//             const errorData = await res.json().catch(() => ({}));
//             console.error('API Error:', errorData.message || 'Unknown error');
//             throw new Error(errorData.message || 'Failed to toggle pin status');
//         }

//         // Refetch applications to get the updated `isPinned` status
//         fetchApplications(); // This will reload the applications and their updated statuses

//     } catch (error) {
//         console.error('Error in handleTogglePin:', error);
//         // Optionally, revert UI if API call failed
//         fetchApplications(); // Re-fetch applications if needed
//     }
// };

    return (
        <div class="oj-flex oj-sm-padding-4x">
            <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between oj-sm-align-items-center">
                <div class="" >
                    <h1 class="oj-typography-heading-lg">Applications</h1>
                </div>
            </div>
            <div class="oj-flex oj-flex-wrap oj-flex-space-" style={"gap: 24px"}>
                {applications.length > 0 ? (
                    (applications || []).map((app) => (
                        <div
                            key={app._id}
                            class="oj-panel oj-panel-shadow-md"
                            style="
                                border: 1px solid #e5e7eb; 
                                border-radius: 12px; 
                                padding: 20px 20px 16px 20px; 
                                max-width: 400px; 
                                min-width: 400px; 
                                flex: 1;
                                display: flex;
                                flex-direction: column;
                                justify-content: space-between;
                            "
                        >
                            {/* Header: Name + Toggle */}
                            <div
                                class="oj-flex"
                                style="
                                    align-items: center;
                                    justify-content: space-between;
                                    margin-bottom: 8px;
                                    width: 100%;
                                "
                            >
                                <div style="flex: 1; display: flex; align-items: center;">
                                    <h3 class="oj-typography-heading-sm" style="margin: 0; flex: 1; word-break: break-word;">
                                        {app.name}
                                        {app.isPinned && (
                                        <span 
                                            class="oj-ux-ico-pin-filled" 
                                            style="color: #4CAF50; margin-left: 8px;"
                                            title="Pinned application"
                                        ></span>
                                    )}
                                    </h3>
                                    
                                    <span
                                        class="oj-typography-body-xs"
                                        style={`
                                            margin-left: 12px;
                                            padding: 2px 10px;
                                            font-weight: 500;
                                            color: ${app.is_active ? '#065f46' : '#991b1b'};
                                            font-size: 0.85em;
            `}
                                    >
                                        {app.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                
                            </div>

                            <p
                                class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-b-2x"
                                style="overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;"
                            >
                                {app.description}
                            </p>

                            <div
                                class="oj-flex"
                                style="justify-content: space-between; align-items: stretch; gap: 32px; margin-bottom: 24px;"
                            >
                                {/* Logs column */}
                                <div style="display: flex; flex-direction: column; align-items: flex-start;
                            background-color: rgba(243, 243, 243, 0.6); padding: 8px; border-radius: 8px; flex: 1;">
                                    <div class="oj-typography-body-sm oj-text-color-secondary">Logs</div>
                                    <div class="oj-typography-heading-md">{app.logCount.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Footer: Created At and pin toggle */}
                            <div
                                class="oj-flex"
                                style="justify-content: space-between; align-items: center; gap: 12px; margin-top: auto;"
                            >
                                <div class="oj-typography-body-xs oj-text-color-secondary">
                                    Created {new Date(app.created_at).toLocaleString()}
                                </div>


                                {/* Pin/Unpin Button */}
                                {/* <div style="display: flex; align-items: center; gap: 4px;">
                                    <span class="oj-typography-body-xs">
                                        {app.isPinned ? 'Pinned' : 'Pin'}
                                    </span>
                                    <oj-switch
                                        value={app.isPinned}
                                        onvalueChanged={(event) => {
                                            handleTogglePin(app._id);
                                        }}
                                        aria-label={app.isPinned ? 'Unpin application' : 'Pin application'}
                                    ></oj-switch>
                                </div> */}


                            </div>
                        </div>
                    ))) : (<div class="oj-typography-body-md oj-sm-margin-4x">
                        No applications found. Contact administrator for application access.
                    </div>)
                }
            </div>

        </div>
    );
};
export default UserApplications;
