import { useEffect, useState } from "preact/hooks";
import { h } from 'preact';
import 'ojs/ojdialog';
import 'ojs/ojbutton';
import 'ojs/ojformlayout';
import LogGraph from "./components/LogGraph";

import { Application } from "../../services/dashboard.services";
import dashboardService from "../../services/dashboard.services";
import { handleCheckboxChange, savePinnedApps } from "./components/PinUnpinDialog";
import AppsHealth from "./components/AppsHealth";

const Dashboard = (props: { path?: string; userId?: string }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [userId, setUserId] = useState("");
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorDialogMessage, setErrorDialogMessage] = useState("");

    useEffect(() => {
        const loadApplications = async () => {
            try {
                const { applications: fetchedApplications, userId: fetchedUserId } = await dashboardService.fetchApplications();
                setApplications(fetchedApplications);
                setUserId(fetchedUserId);
            } catch (error) {
                console.error("Failed to fetch applications", error);
            }
        };
        loadApplications();
    }, []);

    useEffect(() => {
        const pinnedAppIds = applications.filter(app => app.isPinned).map(app => app._id);
        setSelectedAppIds(pinnedAppIds);
    }, [applications]);

    const pinnedApplications = applications.filter(app => app.isPinned);

    return (
        <div class="oj-flex oj-sm-padding-6x">

            <div class={'oj-flex-item oj-sm-margin-4x-bottom'} >
                <div class="oj-flex oj-flex-direction-col oj-sm-flex-items-1 oj-sm-justify-content-space-between oj-sm-margin-2x-bottom">
                    <h3 style={{
                        margin: 0,
                        fontWeight: "bold",
                        fontSize: "1.3rem"
                    }}>Application Health</h3>
                </div>
                <AppsHealth userId={userId} />
                {/* <div class="oj-panel oj-panel-shadow-xs oj-sm-padding-4x">
                </div> */}
            </div>

            {/* <div class={'oj-flex-item oj-sm-margin-4x-bottom'} >
                <div class="oj-panel oj-panel-shadow-xs oj-sm-padding-4x">
                    <div class="oj-flex oj-flex-direction-col oj-sm-flex-items-1 oj-sm-justify-content-space-between oj-sm-margin-4x-bottom">
                        <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center" style={{ gap: '0.5rem' }}>
                            <span class="oj-ux-ico-trending-up" style={{
                                color: "#000000",
                                fontSize: "1.5rem",
                                fontFamily: "ojuxIconFont !important"
                            }}></span>
                            <h3 style={{
                                margin: 0,
                                fontWeight: "bold",
                                fontSize: "1.3rem"
                            }}>Logs in the past 24 hours</h3>
                        </div>
                        <oj-button
                            onojAction={() => setShowPinDialog(true)}
                            chroming="callToAction"
                            class="oj-button-sm"
                            style={{ marginRight: '20px' }}
                        >
                            Refresh
                        </oj-button>
                    </div>
                    <LogGraph></LogGraph>

                </div>
            </div> */}

            {/* Combined Graph + Pinned Apps Row */}
            <div
                class="oj-flex"
                style={{
                    width: '100%',
                    gap: '24px',
                    alignItems: 'stretch', // 🔑 makes children match tallest
                }}
            >
                {/* Graph Panel */}
                <div class="oj-flex-item" style={{ flex: '1 1 68%' }}>
                    <div
                        class="oj-panel oj-panel-shadow-xs oj-sm-padding-4x"
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                        <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center oj-sm-justify-content-space-between oj-sm-margin-1x-bottom">

                            <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center" style={{ gap: '0.5rem' }}>
                                <span class="oj-ux-ico-trending-up" style={{
                                    color: "#000000",
                                    fontSize: "1.5rem",
                                    fontFamily: "ojuxIconFont !important"
                                }}></span>
                                <h3 style={{
                                    margin: 0,
                                    fontWeight: "bold",
                                    fontSize: "1.3rem"
                                }}>Logs in the past 24 hours</h3>
                            </div>
                            <oj-button
                                onojAction={()=>{}}
                                chroming="callToAction"
                                class="oj-button-sm"
                            >
                                Refresh
                            </oj-button>
                        </div>
                        <LogGraph />
                    </div>
                </div>

                {/* Pinned Apps Panel */}
                <div class="oj-flex-item" style={{ flex: '1 1 28%' }}>
                    <div class="oj-panel oj-panel-shadow-xs oj-sm-padding-4x" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div>
                            <div class="oj-flex oj-sm-align-items-center" style={{ gap: "8px", marginBottom: "12px" }}>
                                <span class="oj-ux-ico-pin" style={{
                                    color: "#000000",
                                    fontSize: "1.5rem",
                                    fontFamily: "ojuxIconFont !important"
                                }}></span>
                                <h3 style={{
                                    margin: 0,
                                    fontWeight: "bold",
                                    fontSize: "1.3rem"
                                }}>Pinned Applications</h3>
                            </div>

                            <div class="oj-flex oj-flex-direction-col" style={{ gap: "16px" }}>
                                {pinnedApplications.length > 0 ? (
                                    pinnedApplications.map((app) => (
                                        <div
                                            key={app._id}
                                            class="oj-panel oj-panel-shadow-md"
                                            style={{
                                                border: "1px solid #e5e7eb",
                                                borderRadius: "8px",
                                                padding: "12px 16px",
                                                width: "100%",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "flex-start",
                                                fontSize: "0.85rem",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            {/* Header */}
                                            <div class="oj-flex" style={{ alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                                <h3 style={{ margin: "0", wordBreak: "break-word", fontSize: "0.95rem", fontWeight: "600", lineHeight: "1.2", color: "#111827" }}>
                                                    {app.name}
                                                </h3>
                                                <span class="oj-typography-body-xs" style={{
                                                    padding: "2px 8px",
                                                    fontWeight: "500",
                                                    color: app.is_active ? "#065f46" : "#991b1b",
                                                    fontSize: "0.75rem",
                                                    backgroundColor: app.is_active ? "#e6ffed" : "#ffebeb",
                                                    borderRadius: "4px",
                                                    lineHeight: "1.2",
                                                }}>
                                                    {app.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            <p style={{
                                                fontSize: "0.8rem",
                                                color: "#6b7280",
                                                marginBottom: "12px",
                                                overflow: "hidden",
                                                display: "-webkit-box",
                                                WebkitLineClamp: "2",
                                                WebkitBoxOrient: "vertical",
                                            }}>{app.description || "No description available"}</p>

                                            {/* Metrics */}
                                            <div style={{ marginBottom: "12px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                                        <span style={{ color: "black", marginRight: "4px" }}>●</span> Total Logs
                                                    </span>
                                                    <span style={{ fontSize: "1rem", fontWeight: "600" }}>
                                                        {app.criticalLogs?.totalLogs?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                                        <span style={{ color: "red", marginRight: "4px" }}>●</span> Errors
                                                    </span>
                                                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "red" }}>
                                                        {app.criticalLogs?.errorLogs?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                                                        <span style={{ color: "orange", marginRight: "4px" }}>●</span> Warnings
                                                    </span>
                                                    <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "orange" }}>
                                                        {app.criticalLogs?.warningLogs?.toLocaleString() || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div class="oj-typography-body-md">No applications pinned yet.</div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Button */}
                        <div class="oj-flex oj-sm-justify-content-flex-end oj-sm-margin-top-4x">
                            <oj-button
                                onojAction={() => setShowPinDialog(true)}
                                chroming="callToAction"
                                class="oj-button-sm"
                            >
                                + Pin Apps
                            </oj-button>
                        </div>
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
                                                        onChange={() =>
                                                            handleCheckboxChange(
                                                                app._id,
                                                                userId,
                                                                selectedAppIds,
                                                                setSelectedAppIds,
                                                                setApplications,
                                                                setErrorDialogMessage,
                                                                setShowErrorDialog
                                                            )
                                                        }
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

                                    <oj-button
                                        onojAction={() =>
                                            savePinnedApps(
                                                userId,
                                                selectedAppIds,
                                                applications,
                                                setApplications,
                                                setShowPinDialog,
                                                setErrorDialogMessage,
                                                setShowErrorDialog
                                            )
                                        }
                                        chroming="callToAction"
                                        style="margin-left: 0.5rem;"
                                    >
                                        Pin Selected
                                    </oj-button>
                                </div>
                            </oj-dialog>
                        )}

                    </div>
                </div>

            </div>


        </div>
    );
};

export default Dashboard;