import { useEffect, useState } from "preact/hooks";
import { h } from 'preact';
import 'ojs/ojdialog';
import 'ojs/ojbutton';
import 'ojs/ojformlayout';
import LogGraph from "./components/LogGraph";

import AppsHealth from './components/AppsHealth'

interface CriticalLogs {
    totalLogs: number;
    errorLogs: number;
    warningLogs: number;
}

interface Application {
    _id: string;
    name: string;
    description: string;
    isPinned: boolean;
    is_active: boolean;
    logCount: number;
    created_at: string;
    criticalLogs: CriticalLogs;
}

const Dashboard = (props: { path?: string; userId?: string }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [userId, setUserId] = useState("");
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorDialogMessage, setErrorDialogMessage] = useState("");

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        const pinnedAppIds = applications.filter(app => app.isPinned).map(app => app._id);
        setSelectedAppIds(pinnedAppIds);
    }, [applications]);

    const fetchApplications = async () => {
        try {
            const token = localStorage.getItem('jwt');
            if (token) {
                const base64Payload = token.split('.')[1];
                const payload = JSON.parse(atob(base64Payload));
                const userId = payload._id;
                setUserId(userId);

                const res = await fetch(`http://localhost:3001/api/applications/${userId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                const data = await res.json();
                setApplications(data.applications || []);
                fetchCriticalLogs(data.applications || []);
            } else {
                console.warn('JWT token not found in localStorage');
            }
        } catch (error) {
            console.error("Failed to fetch applications", error);
        }
    };

    const fetchCriticalLogs = async (applications: Application[]) => {
        const token = localStorage.getItem('jwt');
        if (!token) return;

        const updatedApps = await Promise.all(applications.map(async (app) => {
            try {
                const res = await fetch(`http://localhost:3001/api/applications/logs/critical/${app._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) throw new Error(`Failed to fetch logs for app ${app._id}`);

                const criticalLogs = await res.json();
                return {
                    ...app,
                    criticalLogs: {
                        totalLogs: criticalLogs.totalLogs ?? 0,
                        errorLogs: criticalLogs.errorLogs ?? 0,
                        warningLogs: criticalLogs.warningLogs ?? 0,
                    },
                };
            } catch (error) {
                console.error(`Error fetching logs for app ${app._id}:`, error);
                return {
                    ...app,
                    criticalLogs: { totalLogs: 0, errorLogs: 0, warningLogs: 0 },
                };
            }
        }));

        setApplications(updatedApps);
    };

    const handleCheckboxChange = async (appId: string) => {
        const wasSelected = selectedAppIds.includes(appId);
        setSelectedAppIds(prev =>
            wasSelected
                ? prev.filter(id => id !== appId)
                : prev.length < 3
                    ? [...prev, appId]
                    : prev
        );

        if (wasSelected) {
            try {
                const token = localStorage.getItem('jwt');
                if (!token || !userId) return;

                const response = await fetch(
                    `http://localhost:3001/api/applications/unpin/${userId}/${appId}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to unpin application');
                }

                setApplications(prev => prev.map(app =>
                    app._id === appId ? { ...app, isPinned: false } : app
                ));


            } catch (error) {
                console.error('Error unpinning application:', error);
                setSelectedAppIds(prev => [...prev, appId]);
                setErrorDialogMessage("Failed to unpin application");
                setShowErrorDialog(true);
            }
        } else {
            if (selectedAppIds.length >= 3) {
                setErrorDialogMessage("You can pin a maximum of 3 applications.");
                setShowErrorDialog(true);
            }
        }
    };


    const savePinnedApps = async () => {
        try {
            const token = localStorage.getItem('jwt');
            if (!token || !userId) return;

            const appsToPin = selectedAppIds.filter(appId =>
                !applications.find(app => app._id === appId)?.isPinned
            );

            const results = await Promise.all(appsToPin.map(async appId => {
                const response = await fetch(
                    `http://localhost:3001/api/applications/pin/${userId}/${appId}`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to pin application');
                }
                return appId;
            }));

            setApplications(prev => prev.map(app =>
                selectedAppIds.includes(app._id)
                    ? { ...app, isPinned: true }
                    : app
            ));
            if (appsToPin.length > 0) {
                const pinnedNames = applications
                    .filter(app => appsToPin.includes(app._id))
                    .map(app => app.name)
                    .join(', ');

                setErrorDialogMessage(`Pinned: ${pinnedNames}`);
                setShowErrorDialog(true);
            }
            setShowPinDialog(false);


        } catch (error) {
            console.error('Error saving pinned apps:', error);
            setErrorDialogMessage(
                error && typeof error === "object" && "message" in error
                    ? (error as { message: string }).message
                    : "Failed to save pinned apps"
            );
            setShowErrorDialog(true);
        }
    };

    const pinnedApplications = applications.filter(app => app.isPinned);

    return (
        <div class="oj-flex oj-sm-padding-4x">

            <div class="oj-flex oj-sm-12 oj-sm-margin-bottom-2x oj-sm-justify-content-space-between oj-sm-align-items-center"
                style={{ marginBottom: "12px" }}>
                <div class="oj-flex oj-sm-align-items-center" style={{ gap: "4px" }}>
                    <h3 style={{
                        margin: 0,
                        fontWeight: "bold",
                        fontSize: "1.3rem"
                    }}>Application Health</h3>
                </div>
            </div>
            <div class={'oj-flex-item oj-sm-margin-4x-bottom'} >
                <AppsHealth userId={userId} />
            </div>

            <div class="oj-flex oj-sm-12 oj-sm-margin-bottom-2x oj-sm-justify-content-space-between oj-sm-align-items-center"
                style={{ marginBottom: "12px" }}>
                <div class="oj-flex oj-sm-align-items-center" style={{ gap: "4px" }}>
                    <h3 style={{
                        margin: 0,
                        fontWeight: "bold",
                        fontSize: "1.3rem"
                    }}>Logs in the past 24 hours</h3>
                </div>
            </div>
            <div class={'oj-flex-item oj-sm-margin-4x-bottom'} >
                <LogGraph></LogGraph>
            </div>

            <div class="oj-flex oj-sm-12 oj-sm-margin-bottom-2x oj-sm-justify-content-space-between oj-sm-align-items-center"
                style={{ marginBottom: "12px" }}>
                <div class="oj-flex oj-sm-align-items-center" style={{ gap: "4px" }}>
                    <span class="oj-ux-ico-pin" style={{
                        color: "#808080",
                        fontSize: "1rem",
                        fontFamily: "ojuxIconFont !important"
                    }}></span>
                    <h3 style={{
                        margin: 0,
                        fontWeight: "bold",
                        fontSize: "1.3rem"
                    }}>Pinned Applications</h3>
                </div>


                <oj-button
                    onojAction={() => setShowPinDialog(true)}
                    chroming="callToAction"
                    class="oj-button-sm"
                    style={{ marginRight: '20px' }}
                >
                    + Pin Apps
                </oj-button>
            </div>

            {/* Pin Apps Dialog */}
            {showPinDialog && (
                <oj-dialog
                    id="pinDialog"
                    dialogTitle="Pin/Unpin Applications"
                    initialVisibility="show"
                    style="--dialog-width: 100px;"
                >
                    <div class="oj-dialog-body" style="padding: 0.5rem 1rem; max-height: calc(100vh - 200px); overflow-y: auto;">
                        <oj-form-layout>
                            {applications.map(app => (
                                <div
                                    key={app._id}
                                    class="oj-flex oj-sm-align-items-center"
                                    style="padding: 0.25rem 0; min-height: 32px;"
                                >
                                    <label class="oj-checkbox-wrapper" style="display: flex; align-items: center; width: 100%; margin-left: 20px;">
                                        <input
                                            type="checkbox"
                                            class="oj-checkbox-input"

                                            checked={selectedAppIds.includes(app._id)}
                                            onChange={() => handleCheckboxChange(app._id)}
                                            style="margin-right: 8px;"
                                        />
                                        <span class="oj-typography-body-md" style="flex-grow: 1;">
                                            {app.name}
                                        </span>
                                        {app.isPinned && (
                                            <span
                                                class="oj-ux-ico-pin-filled"
                                                style="color: #4CAF50; font-size: 0.875rem;"
                                                title="Currently pinned"
                                            ></span>
                                        )}
                                    </label>
                                </div>
                            ))}
                        </oj-form-layout>
                    </div>
                    <div class="oj-dialog-footer" style="padding: 0.75rem; border-top: 1px solid var(--oj-core-divider-color);">
                        {errorMessage && (
                            <div class="oj-message-banner oj-message-banner-error"
                                style="margin-bottom: 0.5rem; padding: 0.5rem;">
                                <span class="oj-message-banner-icon oj-ux-ico-error" aria-hidden="true"></span>
                                <span>{errorMessage}</span>
                            </div>
                        )}
                        <oj-button
                            onojAction={() => {
                                const pinnedIds = applications.filter(app => app.isPinned).map(app => app._id);
                                setSelectedAppIds(pinnedIds);
                                setShowPinDialog(false);
                            }}
                            chroming="borderless"
                        >
                            Cancel
                        </oj-button>

                        <oj-button onojAction={savePinnedApps} chroming="callToAction" style="margin-left: 0.5rem;">
                            Pin Selected
                        </oj-button>
                    </div>
                </oj-dialog>
            )}

            {/* Pinned Applications Cards */}
            <div
                class="oj-flex oj-flex-wrap"
                style={{
                    gap: "16px",
                    width: "100%",
                }}
            >
                {pinnedApplications.length > 0 ? (
                    pinnedApplications.map((app) => (
                        <div
                            key={app._id}
                            class="oj-panel oj-panel-shadow-md"
                            style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                padding: "12px 16px",
                                flex: "1 1 calc(33.333% - 16px)",
                                minWidth: "300px",
                                maxWidth: "calc(33.333% - 16px)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-start",
                                fontSize: "0.85rem",
                                boxSizing: "border-box",
                            }}
                        >
                            {/* Header: Name + Status */}
                            <div
                                class="oj-flex"
                                style={{
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}
                            >
                                <h3
                                    style={{
                                        margin: "0",
                                        wordBreak: "break-word",
                                        fontSize: "0.95rem",
                                        fontWeight: "600",
                                        lineHeight: "1.2",
                                        color: "#111827"
                                    }}
                                >
                                    {app.name}
                                </h3>
                                <span
                                    class="oj-typography-body-xs"
                                    style={{
                                        padding: "2px 8px",
                                        fontWeight: "500",
                                        color: app.is_active ? "#065f46" : "#991b1b",
                                        fontSize: "0.75rem",
                                        backgroundColor: app.is_active ? "#e6ffed" : "#ffebeb",
                                        borderRadius: "4px",
                                        lineHeight: "1.2",
                                    }}
                                >
                                    {app.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>

                            {/* App Description */}
                            <p
                                style={{
                                    fontSize: "0.8rem",
                                    color: "#6b7280",
                                    marginBottom: "12px",
                                    overflow: "hidden",
                                    display: "-webkit-box",
                                    WebkitLineClamp: "2",
                                    WebkitBoxOrient: "vertical",
                                }}
                            >
                                {app.description || "No description available"}
                            </p>

                            {/* Log metrics */}
                            <div style={{ marginBottom: "12px" }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "4px"
                                }}>
                                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                        <span style={{ color: "black", marginRight: "4px" }}>●</span>
                                        Total Logs
                                    </span>
                                    <span style={{ fontSize: "1rem", fontWeight: "600" }}>
                                        {app.criticalLogs?.totalLogs?.toLocaleString() || 0}
                                    </span>
                                </div>

                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "4px"
                                }}>
                                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                        <span style={{ color: "red", marginRight: "4px" }}>●</span>
                                        Errors
                                    </span>
                                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "red" }}>
                                        {app.criticalLogs?.errorLogs?.toLocaleString() || 0}
                                    </span>
                                </div>

                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}>
                                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                        <span style={{ color: "orange", marginRight: "4px" }}>●</span>
                                        Warnings
                                    </span>
                                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "orange" }}>
                                        {app.criticalLogs?.warningLogs?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div class="oj-typography-body-md oj-sm-margin-4x">No applications pinned yet.</div>
                )}
                {showErrorDialog && (
                    <oj-dialog
                        id="errorDialog"
                        dialogTitle={
                            errorDialogMessage.startsWith("App(s)") || errorDialogMessage.startsWith("Pinned")
                                ? "Success"
                                : "Error"
                        }
                        initialVisibility="show"
                        onojClose={() => setShowErrorDialog(false)}
                    >
                        <div class="oj-dialog-body">
                            <p>{errorDialogMessage}</p>
                        </div>
                        <div class="oj-dialog-footer">
                            <oj-button onojAction={() => setShowErrorDialog(false)} chroming="callToAction">
                                OK
                            </oj-button>
                        </div>
                    </oj-dialog>
                )}


            </div>
        </div>
    );
};

export default Dashboard;



