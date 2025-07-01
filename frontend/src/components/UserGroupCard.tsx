import React, { useState } from 'react';
import AppAccessModal from './AppAccessModal';

interface Props {
  group: {
    _id: string;
    name: string;
    description: string;
    assigned_app_ids: string[];
  };
}

const UserGroupCard: React.FC<Props> = ({ group }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-white shadow p-4 rounded-xl relative">
      <div className="absolute top-2 right-2">
        <button onClick={() => setIsModalOpen(true)}>⋮</button>
      </div>

      <h2 className="text-lg font-bold">{group.name}</h2>
      <p>{group.description}</p>

      <AppAccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        groupId={group._id}
        initiallySelectedAppIds={group.assigned_app_ids || []}
      />
    </div>
  );
};

export default UserGroupCard;
