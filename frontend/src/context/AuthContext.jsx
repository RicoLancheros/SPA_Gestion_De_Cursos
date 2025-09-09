import { createContext, useContext, useReducer, useEffect } from 'react';
import apiClient, { 
  setAuthTokens, 
  clearAuthTokens, 
  getStoredUser, 
  setStoredUser 
} from '../config/api';

// Estados iniciales
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Tipos de acciones
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_PROFILE: 'UPDATE_PROFILE'
};

// Reducer para manejar el estado de autenticación
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        isLoading: false
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    default:
      return state;
  }
};

// Crear contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Provider del contexto
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = getStoredUser();
        const token = localStorage.getItem('token');
        
        if (storedUser && token) {
          // Verificar que el token siga siendo válido
          const response = await apiClient.get('/auth/verify-token');
          
          if (response.data.success) {
            dispatch({
              type: AUTH_ACTIONS.SET_USER,
              payload: { user: storedUser }
            });
          } else {
            // Token inválido, limpiar todo
            clearAuthTokens();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        clearAuthTokens();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    initAuth();
  }, []);

  // Función para login
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      if (response.data.success) {
        const { user, token, refreshToken } = response.data;
        
        // Guardar tokens y usuario
        setAuthTokens(token, refreshToken);
        setStoredUser(user);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user }
        });
        
        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Error en el login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });
      
      return { success: false, error: errorMessage };
    }
  };

  // Función para registro
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      if (response.data.success) {
        const { user, token, refreshToken } = response.data;
        
        // Guardar tokens y usuario
        setAuthTokens(token, refreshToken);
        setStoredUser(user);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user }
        });
        
        return { success: true, user };
      } else {
        throw new Error(response.data.message || 'Error en el registro');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });
      
      return { success: false, error: errorMessage };
    }
  };

  // Función para logout
  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      clearAuthTokens();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Función para actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        setStoredUser(updatedUser);
        
        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: updatedUser
        });
        
        return { success: true, user: updatedUser };
      } else {
        throw new Error(response.data.message || 'Error actualizando perfil');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error actualizando perfil';
      return { success: false, error: errorMessage };
    }
  };

  // Función para cambiar contraseña
  const changePassword = async (passwordData) => {
    try {
      const response = await apiClient.post('/auth/change-password', passwordData);
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || 'Error cambiando contraseña');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error cambiando contraseña';
      return { success: false, error: errorMessage };
    }
  };

  // Limpiar errores
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Valor del contexto
  const value = {
    // Estado
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Acciones
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    
    // Utilidades
    isAdmin: state.user?.rol === 'administrador',
    isTeacher: state.user?.rol === 'profesor',
    isStudent: state.user?.rol === 'estudiante'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;