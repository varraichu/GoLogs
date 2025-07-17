// src/context/UserContext.tsx
import { useContext, useReducer, useEffect } from 'preact/hooks'
import { h, ComponentChildren, createContext } from 'preact'
import config from '../config/config'

// Types
interface User {
    _id: string
    username: string
    email: string
    picture: string
    isAdmin: boolean
}

interface UserState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

interface UserContextType extends UserState {
    login: () => Promise<void>
    logout: () => Promise<void>
    refetchUser: () => Promise<void>
}

// Initial state
const initialState: UserState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
}

// Actions
type UserAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_USER'; payload: User }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'CLEAR_USER' }
    | { type: 'SET_AUTHENTICATED'; payload: boolean }

// Reducer
const userReducer = (state: UserState, action: UserAction): UserState => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload }
        case 'SET_USER':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null
            }
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                isAuthenticated: false,
                isLoading: false
            }
        case 'CLEAR_USER':
            return {
                ...state,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            }
        case 'SET_AUTHENTICATED':
            return { ...state, isAuthenticated: action.payload }
        default:
            return state
    }
}

// Context
const UserContext = createContext<UserContextType | null>(null)

// Helper function to get error message
const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return 'An unknown error occurred'
}

// Provider component
interface UserProviderProps {
    children: ComponentChildren
}

export const UserProvider = ({ children }: UserProviderProps) => {
    const [state, dispatch] = useReducer(userReducer, initialState)

    // Fetch user function
    const fetchUser = async (): Promise<User | null> => {
        try {
            const res = await fetch(`${config.API_BASE_URL}/oauth/me`, {
                method: 'GET',
                credentials: 'include'
            })

            if (!res.ok) {
                throw new Error('Not authenticated')
            }

            const data = await res.json()
            
            // 🔥 DEBUG: Log the full response and user data
            console.log('Full API response:', data)
            console.log('User data:', data.user)
            console.log('Picture URL:', data.user.picture)
            
            return data.user
        } catch (error) {
            console.error('Failed to fetch user:', error)
            return null
        }
    }

    // Login function (fetches user data)
    const login = async () => {
        dispatch({ type: 'SET_LOADING', payload: true })

        try {
            const user = await fetchUser()
            if (user) {
                // 🔥 DEBUG: Log user data before setting in context
                console.log('Setting user in context:', user)
                dispatch({ type: 'SET_USER', payload: user })
            } else {
                dispatch({ type: 'SET_ERROR', payload: 'Failed to authenticate' })
            }
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) })
        }
    }

    // Logout function
    const logout = async () => {
        try {
            // Call logout endpoint
            await fetch(`${config.API_BASE_URL}/oauth/logout`, {
                method: 'POST',
                credentials: 'include'
            })
        } catch (error) {
            console.error('Logout request failed:', error)
        } finally {
            // Always clear user data regardless of logout request success
            dispatch({ type: 'CLEAR_USER' })
        }
    }

    // Refetch user (for manual refresh if needed)
    const refetchUser = async () => {
        await login()
    }

    // Auto-fetch user on mount
    useEffect(() => {
        login()
    }, [])

    const value: UserContextType = {
        ...state,
        login,
        logout,
        refetchUser
    }

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

// Custom hook to use the context
export const useUser = (): UserContextType => {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}

// Helper hook for getting user data (with null check)
export const useCurrentUser = (): User | null => {
    const { user } = useUser()
    return user
}

// Helper hook for authentication status
export const useAuth = () => {
    const { isAuthenticated, isLoading, login, logout } = useUser()
    return { isAuthenticated, isLoading, login, logout }
}