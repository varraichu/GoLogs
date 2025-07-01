import React, { useEffect, useState } from 'react';
import { getUserGroups } from '../services/userGroupService';
import UserGroupCard from '../components/UserGroupCard';

const UserGroupsPage = () => {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    getUserGroups().then(setGroups);
  }, []);

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group: any) => (
        <UserGroupCard key={group._id} group={group} />
      ))}
    </div>
  );
};

export default UserGroupsPage;
