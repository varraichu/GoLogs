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
}



const UserApplications = (props: { path?: string }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [userId, setUserId] = useState("");

    // const [showDialog, setShowDialog] = useState(false);
    // const [editingApplication, setEditingApplication] = useState<Application | null>(null);
    // const [description, setDescription] = useState("");
    // const [errors, setErrors] = useState<{ name?: string; description?: string }>({});
    // const nameRef = useRef<any>(null);
    // const descRef = useRef<any>(null);
    // const [appUserGroups, setAppUserGroups] = useState<string[]>([]);
    // const [assignedGroupIds, setAssignedGroupIds] = useState<any>(new Set([]))
    // const [initialAssignedGroupIds, setInitialAssignedGroupIds] = useState<any>(new Set([]))

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
                    const res = await fetch(`http://localhost:3001/api/applications/${userId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        }
                    });
                    const data = await res.json();
                    setApplications(data.applications || []);
                    console.log("Fetched: ", applications);
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


    return (
        <div class="oj-flex oj-sm-padding-4x">
            <div class="oj-flex oj-sm-12 oj-sm-margin-4x oj-sm-justify-content-space-between oj-sm-align-items-center">
                <div class="" >
                    <h1 class="oj-typography-heading-lg">Applications</h1>
                </div>
            </div>

            <div class="oj-flex oj-sm-flex-wrap oj-sm-justify-content-center oj-sm-padding-4x ">
                {applications.length > 0 ? (
                    (applications || []).map((application) => (
                        <div
                            class="oj-sm-12 oj-md-4 oj-flex-item oj-panel oj-panel-shadow-md oj-sm-margin-4x"
                            style="border: 1px solid #ccc; border-radius: 12px; padding: 24px; min-width: 280px; max-width: 360px; display: flex; flex-direction: column; justify-content: space-between;"
                        >
                            <div>
                                <div class="oj-typography-heading-sm oj-sm-margin-bottom-2x">{application.name}</div>
                                <div class="oj-typography-body-sm oj-sm-margin-bottom-2x">{application.description}</div>
                                <div class="oj-typography-body-xs oj-sm-margin-bottom">👤 Users: {application.groupCount}</div>
                                <div class="oj-typography-body-xs oj-sm-margin-bottom"> Logs: {application.logCount}</div>
                            </div>
                            <div class="oj-sm-margin-4x">
                                {(application.groupNames || []).map((group) => (
                                    <span class="oj-badge oj-badge-subtle oj-sm-margin-2x">{group}</span>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div class="oj-typography-body-md oj-sm-margin-4x">
                        No applications found. Contact administrator for application access.
                    </div>
                )}
            </div>

        </div>
    );
};
export default UserApplications;
