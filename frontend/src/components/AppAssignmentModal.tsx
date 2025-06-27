// src/components/AppAssignmentModal.tsx
import { useEffect, useState } from 'react';
import {
  fetchApplications,
  fetchGroupApplications,
  updateGroupApplications
} from '../services/api';

type Props = {
  groupId: string;
  groupName: string;
  onClose: () => void;
};

export default function AppAssignmentModal({ groupId, groupName, onClose }: Props) {
  const [apps, setApps] = useState<{ _id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [appsRes, assignedRes] = await Promise.all([
        fetchApplications(),
        fetchGroupApplications(groupId)
      ]);
      setApps(appsRes.data);
      setSelected(assignedRes.data.appIds);
    }

    loadData();
  }, [groupId]);

  const toggleApp = (appId: string) => {
    setSelected((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const save = async () => {
    setLoading(true);
    await updateGroupApplications(groupId, selected);
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Manage App Access for: {groupName}</h3>
        <ul>
          {apps.map((app) => (
            <li key={app._id}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(app._id)}
                  onChange={() => toggleApp(app._id)}
                />
                {app.name}
              </label>
            </li>
          ))}
        </ul>
        <div className="actions">
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={save} disabled={loading}>Save</button>
        </div>
      </div>
    </div>
  );
}
