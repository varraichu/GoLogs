import React, { useState, useEffect } from 'react';
import UserGroupCard from '../components/UserGroupCard';

interface UserGroup {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  is_deleted: boolean;
}

const UserGroupsPage: React.FC = () => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserGroups();
  }, []);

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      const response = await fetch('/api/user-groups');
      const data = await response.json();
      
      if (data.success) {
        setUserGroups(data.data.filter((group: UserGroup) => !group.is_deleted));
      } else {
        setError('Failed to load user groups');
      }
    } catch (err) {
      setError('Failed to load user groups');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchUserGroups}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Groups</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Add Group
        </button>
      </div>

      {userGroups.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No user groups found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userGroups.map((group) => (
            <UserGroupCard
              key={group._id}
              group={group}
              onRefresh={fetchUserGroups}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserGroupsPage;