// src/context/AuthContext.tsx
import { createContext, useContext } from 'react';

export const AuthContext = createContext({ role: 'admin' }); // mock

export const useAuth = () => useContext(AuthContext);
