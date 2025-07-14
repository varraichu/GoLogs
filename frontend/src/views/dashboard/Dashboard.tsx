import { useEffect, useState } from "preact/hooks";
import { h } from 'preact';
import 'ojs/ojdialog';
import 'ojs/ojbutton';
import 'ojs/ojformlayout';

import LogGraph from "./components/LogGraph";
import AppsHealth from "./components/AppsHealth";
import DashboardRecentLogs from "./components/DashboardRecentLogs";
import { PinnedAppsSection } from "./components/PinnedAppsSection";
import { PinUnpinDialog, handleCheckboxChange, savePinnedApps } from "./components/PinUnpinDialog";

import dashboardService, { Application } from "../../services/dashboard.services";

const Dashboard = (props: { path?: string; userId?: string, setActiveItem: (str: string) => void }) => {
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
                console.error("Failed to fetch applications", error); //add toast here
            }
        };
        loadApplications();
    }, []);

    useEffect(() => {
        const pinnedAppIds = applications.filter(app => app.isPinned).map(app => app._id);
        setSelectedAppIds(pinnedAppIds);
    }, [applications]);

    return (
        <div class="oj-flex oj-sm-padding-4x oj-sm-flex-direction-column" style="gap: 32px;">

            {/* Application Health */}
            <div class="oj-flex oj-sm-12 oj-sm-justify-content-space-between oj-sm-align-items-center">
                <div class="oj-flex oj-sm-align-items-center" style="gap: 4px;">
                    <h3 style={{ margin: 0, fontWeight: "bold", fontSize: "1.3rem" }}>Application Health</h3>
                </div>
            </div>
            <div class="oj-flex-item oj-sm-margin-4x-bottom">
                <AppsHealth userId={userId} setActiveItem={props.setActiveItem} />
            </div>

            {/* Logs Graph & Pinned Apps */}
            <div
                class="oj-flex"
                style={{
                    width: '100%',
                    gap: '24px',
                    alignItems: 'stretch',
                }}
            >

                <div class="oj-flex-item" style={{ flex: '1 1 58%' }}>
                    <div
                        class="oj-panel oj-panel-shadow-xs oj-sm-padding-4x"
                        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    >
                        <LogGraph />
                    </div>
                </div>

                <div class="oj-flex-item" style={{ flex: '1 1 28%' }}>


                    <div class="oj-panel oj-panel-shadow-xs oj-sm-padding-4x" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <PinnedAppsSection
                            applications={applications}
                            userId={userId}
                            setApplications={setApplications}
                        />
                    </div>
                </div>


            </div>


            {/* Recent Logs */}
            <div
                class="oj-panel oj-panel-shadow-xs oj-sm-padding-4x"
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            >
                <DashboardRecentLogs setActiveItem={props.setActiveItem} />
            </div>


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
        </div>
    );
};

export default Dashboard;
