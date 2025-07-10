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