import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  requiredRoles = [],
  allowedRoles = [],
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Verificando acceso...
        </Typography>
      </Box>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Verificar roles si se especificaron
  if (requiredRole || requiredRoles.length > 0 || allowedRoles.length > 0) {
    const userRole = user?.rol;
    let hasPermission = false;

    // Verificar rol único requerido
    if (requiredRole) {
      hasPermission = userRole === requiredRole;
    }
    
    // Verificar lista de roles requeridos (todos deben coincidir)
    else if (requiredRoles.length > 0) {
      hasPermission = requiredRoles.includes(userRole);
    }
    
    // Verificar roles permitidos (al menos uno debe coincidir)
    else if (allowedRoles.length > 0) {
      hasPermission = allowedRoles.includes(userRole);
    }

    // Si no tiene permisos, redirigir a acceso denegado o dashboard
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Si todo está bien, mostrar el contenido
  return children;
};

// Componente específico para rutas de administrador
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="administrador">
    {children}
  </ProtectedRoute>
);

// Componente específico para rutas de profesor
export const TeacherRoute = ({ children }) => (
  <ProtectedRoute requiredRole="profesor">
    {children}
  </ProtectedRoute>
);

// Componente específico para rutas de estudiante
export const StudentRoute = ({ children }) => (
  <ProtectedRoute requiredRole="estudiante">
    {children}
  </ProtectedRoute>
);

// Componente para rutas que requieren ser profesor o admin
export const TeacherOrAdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['profesor', 'administrador']}>
    {children}
  </ProtectedRoute>
);

// Componente para rutas públicas (solo usuarios no autenticados)
export const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;