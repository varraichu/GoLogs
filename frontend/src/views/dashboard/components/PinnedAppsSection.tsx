import { h } from 'preact';
import { useState, useEffect } from "preact/hooks";
import 'ojs/ojdialog';
import 'ojs/ojbutton';
import 'ojs/ojformlayout';

import { Application } from "../../../services/dashboard.services";
import { PinUnpinDialog, handleCheckboxChange, savePinnedApps } from "./PinUnpinDialog";
import { PinnedAppCard } from "./PinnedAppCard";

interface PinnedAppsSectionProps {
  applications: Application[];
  userId: string;
  setApplications: (apps: (prev: Application[]) => Application[]) => void;
}

export const PinnedAppsSection = ({ applications, userId, setApplications }: PinnedAppsSectionProps) => {
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDialogMessage, setErrorDialogMessage] = useState("");

  useEffect(() => {
    const pinnedAppIds = applications.filter(app => app.isPinned).map(app => app._id);
    setSelectedAppIds(pinnedAppIds);
  }, [applications]);

  const pinnedApplications = applications.filter(app => app.isPinned);

  const handleDialogCheckboxChange = (appId: string) => {
    handleCheckboxChange(
      appId,
      userId,
      selectedAppIds,
      setSelectedAppIds,
      setApplications,
      setErrorDialogMessage,
      setShowErrorDialog,
      applications
    );
  };

  const handleSavePinnedApps = () => {
    savePinnedApps(
      userId,
      selectedAppIds,
      applications,
      setApplications,
      setShowPinDialog,
      setErrorDialogMessage,
      setShowErrorDialog
    );
  };

  const handleCancel = () => {
    const pinnedIds = applications.filter(app => app.isPinned).map(app => app._id);
    setSelectedAppIds(pinnedIds);
    setShowPinDialog(false);
  };

  return (
    <div class="oj-flex-item oj-sm-12">
      <div class="oj-flex oj-sm-12 oj-sm-margin-bottom-2x oj-sm-align-items-center oj-sm-justify-content-space-between oj-sm-margin-top-4x"
        style={{ marginBottom: "12px"}}>
        <div class="oj-flex oj-flex-direction-col oj-sm-align-items-center" style={{ gap: "8px"}}>
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

        <oj-button
          onojAction={() => setShowPinDialog(true)}
          chroming="callToAction"
          class="oj-button-sm"
          style={{ padding: "2px 6px" }}
        >
          + Pin Apps
        </oj-button>

      </div>


      {/* Pinned Applications Cards */}
      <div class="oj-flex oj-flex-direction-col" style={{ gap: "16px" }}>
        {pinnedApplications.length > 0 ? (
          pinnedApplications.map((app) => (
            <PinnedAppCard key={app._id} app={app} />
          ))
        ) : (
          <div class="oj-typography-body-md oj-sm-margin-4x">No applications pinned yet.</div>
        )}
      </div>

      {/* <div class="oj-flex oj-sm-justify-content-flex-end oj-sm-margin-top-4x">
        <oj-button
          onojAction={() => setShowPinDialog(true)}
          chroming="callToAction"
          class="oj-button-sm"
        >
          + Pin Apps
        </oj-button>
      </div> */}

      {/* Pin Apps Dialog */}
      <PinUnpinDialog
        opened={showPinDialog}
        applications={applications}
        selectedAppIds={selectedAppIds}
        onCancel={handleCancel}
        onSave={handleSavePinnedApps}
        handleCheckboxChange={handleDialogCheckboxChange}
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
    </div>
  );
};