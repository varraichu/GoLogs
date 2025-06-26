import React, { useState } from 'react';
import AppAccessModal from './AppAccessModal'; // make the AppAccessModal

interface UserGroup {
  _id: string;
  name: string;
  description: string;
  created_at: string;
}

interface UserGroupCardProps {
  group: UserGroup;
  onRefresh?: () => void;
}

const UserGroupCard: React.FC<UserGroupCardProps> = ({ group, onRefresh }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAppAccessModal, setShowAppAccessModal] = useState(false);

  const handleAppAccessClick = () => {
    setShowDropdown(false);
    setShowAppAccessModal(true);
  };

  const handleModalSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 relative">
        {/* Three dots menu */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
              <div className="py-1">
                <button
                  onClick={handleAppAccessClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  App Access
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card content */}
        <div className="pr-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {group.name}
          </h3>
          <p className="text-gray-600 mb-4">
            {group.description}
          </p>
          <p className="text-sm text-gray-500">
            Created: {new Date(group.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* App Access Modal */}
      <AppAccessModal
        isOpen={showAppAccessModal}
        onClose={() => setShowAppAccessModal(false)}
        group={group}
        onSuccess={handleModalSuccess}
      />
    </>
  );
};

export default UserGroupCard;