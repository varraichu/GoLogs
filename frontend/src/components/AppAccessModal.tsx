import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { getAllApplications, updateGroupAppAccess } from '../services/userGroupService';
import type { Application } from '../types/index';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  initiallySelectedAppIds: string[];
}

const AppAccessModal: React.FC<Props> = ({ isOpen, onClose, groupId, initiallySelectedAppIds }) => {
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchApps = async () => {
      const data = await getAllApplications(); // Define this API
      setApps(data);
      setSelectedAppIds(initiallySelectedAppIds || []);
    };

    if (isOpen) fetchApps();
  }, [isOpen]);

  const handleToggle = (appId: string) => {
    setSelectedAppIds(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const handleSave = async () => {
    await updateGroupAppAccess(groupId, selectedAppIds);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-50">
        <Dialog.Panel className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
          <Dialog.Title className="text-lg font-semibold mb-4">Assign Applications</Dialog.Title>

          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {apps.map(app => (
              <li key={app._id}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAppIds.includes(app._id)}
                    onChange={() => handleToggle(app._id)}
                  />
                  {app.name}
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="text-gray-600 hover:underline">
              Cancel
            </button>
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-md">
              Save
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AppAccessModal;
