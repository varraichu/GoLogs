import { Application } from '../../../services/dashboard.services';

const getAuthHeaders = () => {
  const token = localStorage.getItem('jwt');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const handleCheckboxChange = async (
  appId: string,
  userId: string,
  selectedAppIds: string[],
  setSelectedAppIds: (ids: (prev: string[]) => string[]) => void,
  setApplications: (apps: (prev: Application[]) => Application[]) => void,
  setErrorDialogMessage: (message: string) => void,
  setShowErrorDialog: (show: boolean) => void
) => {
  const wasSelected = selectedAppIds.includes(appId);

  if (wasSelected) {
    setSelectedAppIds(prev => prev.filter(id => id !== appId));
    try {
      const response = await fetch(`http://localhost:3001/api/applications/unpin/${userId}/${appId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to unpin application');
      setApplications(prev => prev.map(app => (app._id === appId ? { ...app, isPinned: false } : app)));
    } catch (error) {
      console.error('Error unpinning application:', error);
      setSelectedAppIds(prev => [...prev, appId]); 
      setErrorDialogMessage('Failed to unpin application');
      setShowErrorDialog(true);
    }
  } else {
    if (selectedAppIds.length >= 3) {
      setErrorDialogMessage('You can pin a maximum of 3 applications.');
      setShowErrorDialog(true);
    } else {
      setSelectedAppIds(prev => [...prev, appId]);
    }
  }
};

export const savePinnedApps = async (
  userId: string,
  selectedAppIds: string[],
  applications: Application[],
  setApplications: (apps: (prev: Application[]) => Application[]) => void,
  setShowPinDialog: (show: boolean) => void,
  setErrorDialogMessage: (message: string) => void,
  setShowErrorDialog: (show: boolean) => void
) => {
  try {
    const appsToPin = selectedAppIds.filter(
      appId => !applications.find(app => app._id === appId)?.isPinned
    );

    await Promise.all(
      appsToPin.map(async appId => {
        const response = await fetch(`http://localhost:3001/api/applications/pin/${userId}/${appId}`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to pin application ${appId}`);
        }
      })
    );

    setApplications(prev =>
      prev.map(app => ({ ...app, isPinned: selectedAppIds.includes(app._id) }))
    );

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
    const message = error instanceof Error ? error.message : 'Failed to save pinned apps';
    setErrorDialogMessage(message);
    setShowErrorDialog(true);
  }
};

interface PinUnpinDialogProps {
    opened: boolean;
    onCancel: () => void;
    onSave: () => void;
    applications: Application[];
    selectedAppIds: string[];
    handleCheckboxChange: (appId: string) => void;
    errorMessage?: string;
}

export const PinUnpinDialog = ({
    opened,
    onCancel,
    onSave,
    applications,
    selectedAppIds,
    handleCheckboxChange,
    errorMessage
}: PinUnpinDialogProps) => {
    if (!opened) {
        return null;
    }

    return (
        <oj-dialog
            id="pinDialog"
            dialogTitle="Pin/Unpin Applications"
            initialVisibility="show"
            onojClose={onCancel}
            style="--dialog-width: 400px;" 
        >
            <div class="oj-dialog-body" style="padding: 0.5rem 1rem; max-height: calc(100vh - 200px); overflow-y: auto;">
                <oj-form-layout>
                    {applications.map(app => (
                        <div
                            key={app._id}
                            class="oj-flex oj-sm-align-items-center"
                            style="padding: 0.25rem 0; min-height: 32px;"
                        >
                            <label class="oj-checkbox-wrapper" style="display: flex; align-items: center; width: 100%;">
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
                <oj-button onojAction={onCancel} chroming="borderless">
                    Cancel
                </oj-button>
                <oj-button onojAction={onSave} chroming="callToAction" style="margin-left: 0.5rem;">
                    Pin Selected
                </oj-button>
            </div>
        </oj-dialog>
    );
};