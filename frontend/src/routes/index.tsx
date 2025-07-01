import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserGroupsPage from '../pages/UserGroupsPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<UserGroupsPage />} />
    </Routes>
  );
};

export default AppRoutes;