import { useEffect, useState } from "preact/hooks";
import { h } from 'preact';
import 'ojs/ojdialog';
import 'ojs/ojbutton';
import 'ojs/ojformlayout';
import LogGraph from "./components/LogGraph";

import { Application } from "../../services/dashboard.services";
import dashboardService from "../../services/dashboard.services";
import { PinUnpinDialog, handleCheckboxChange, savePinnedApps } from "./components/PinUnpinDialog";
import AppsHealth from "./components/AppsHealth";
import { PinnedAppsSection } from "./components/PinnedAppsSection";
import DashboardRecentLogs from "./components/DashboardRecentLogs";


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

            <PinnedAppsSection 
                applications={applications} 
                userId={userId} 
                setApplications={setApplications} 
            />

            {/* Error Dialog */}
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
            
            <DashboardRecentLogs></DashboardRecentLogs>
            </div>
    );
};

export default Dashboard;