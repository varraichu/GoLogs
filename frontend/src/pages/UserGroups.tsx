// import React from 'react'

// const UserGroups = () => {
//   return (
//     <div>
//       <p>User Groups</p>
//     </div>
//   )
// }

// export default UserGroups

import { useEffect, useState } from 'react';
import { fetchGroups } from '../services/api';
import GroupCard from '../components/UserGroupCard';
import { useAuth } from '../context/AuthContext';

export default function UserGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const { role } = useAuth();

  useEffect(() => {
    fetchGroups().then((res) => {
      console.log('Fetched groups:', res.data);
      // Ensure it's an array before setting state
      if (Array.isArray(res.data)) {
        setGroups(res.data);
      } else {
        console.error('Expected array but got:', res.data);
        setGroups([]); // fallback
      }
    }).catch((err) => {
      console.error('Failed to fetch groups:', err);
      setGroups([]);
    });
  }, []);

  return (
    <div>
      <h2>User Groups</h2>
      <div className="group-list">
        {groups.length > 0 ? (
          groups.map((group) => (
            <GroupCard key={group._id} group={group} isAdmin={role === 'admin'} />
          ))
        ) : (
          <p>No groups found.</p>
        )}
      </div>
    </div>
  );
}
