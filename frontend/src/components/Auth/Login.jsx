import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  School
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '@mui/material/styles';

const Login = () => {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const location = useLocation();
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    cedula: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si ya está autenticado
  if (isAuthenticated && !isLoading) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.cedula.trim()) {
      errors.cedula = 'La cédula es requerida';
    } else if (!/^\d{8,12}$/.test(formData.cedula.trim())) {
      errors.cedula = 'La cédula debe tener entre 8 y 12 dígitos';
    }
    
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejar cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo al escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Limpiar error general
    if (error) {
      clearError();
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await login({
        cedula: formData.cedula.trim(),
        password: formData.password
      });
      
      if (!result.success) {
        // El error ya está manejado por el contexto
        console.error('Login failed:', result.error);
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle visibilidad de contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        minWidth: '100vw',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: { xs: 1, sm: 2, md: 3 },
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <Container 
        component="main" 
        maxWidth="sm"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        <Paper
          elevation={10}
          sx={{
            padding: { xs: 3, sm: 4, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '500px',
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            margin: 'auto'
          }}
        >
          {/* Logo y título */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2
              }}
            >
              <School
                sx={{
                  fontSize: 48,
                  color: 'primary.main',
                  mr: 1
                }}
              />
              <Typography
                component="h1"
                variant="h3"
                sx={{
                  fontWeight: 'bold',
                  color: 'primary.main',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' }
                }}
              >
                SPA Cursos
              </Typography>
            </Box>

            <Typography 
              component="h2" 
              variant="h5" 
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                textAlign: 'center'
              }}
            >
              Iniciar Sesión
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                textAlign: 'center',
                fontStyle: 'italic'
              }}
            >
              Sistema de Gestión de Cursos - SENA
            </Typography>
          </Box>

          {/* Mensaje de error general */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ width: '100%', mb: 2 }}
              onClose={clearError}
            >
              {error}
            </Alert>
          )}

          {/* Formulario */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ 
              width: '100%',
              maxWidth: '400px'
            }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="cedula"
              label="Cédula"
              name="cedula"
              autoComplete="username"
              autoFocus
              value={formData.cedula}
              onChange={handleInputChange}
              error={!!formErrors.cedula}
              helperText={formErrors.cedula}
              placeholder="Ejemplo: 1234567890"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || isLoading}
              sx={{
                mt: 3,
                mb: 3,
                py: 1.8,
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(25, 118, 210, 0.4)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.6)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.3s ease'
              }}
              startIcon={
                isSubmitting || isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <LoginIcon />
                )
              }
            >
              {isSubmitting || isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>

            {/* Link de registro */}
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/register"
                  style={{
                    color: '#1976d2',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#1565c0'}
                  onMouseLeave={(e) => e.target.style.color = '#1976d2'}
                >
                  Regístrate aquí
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;