import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
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
  IconButton,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  School
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si ya está autenticado
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    // Validar cédula
    if (!formData.cedula.trim()) {
      errors.cedula = 'La cédula es requerida';
    } else if (!/^\d{8,12}$/.test(formData.cedula.trim())) {
      errors.cedula = 'La cédula debe tener entre 8 y 12 dígitos';
    }
    
    // Validar nombre
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }
    
    // Validar apellido
    if (!formData.apellido.trim()) {
      errors.apellido = 'El apellido es requerido';
    } else if (formData.apellido.trim().length < 2) {
      errors.apellido = 'El apellido debe tener al menos 2 caracteres';
    }
    
    // Validar email
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'El email no tiene un formato válido';
    }
    
    // Validar teléfono
    if (!formData.telefono.trim()) {
      errors.telefono = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(formData.telefono.trim())) {
      errors.telefono = 'El teléfono debe tener 10 dígitos';
    }
    
    // Validar contraseña
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      errors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'La contraseña debe tener al menos una mayúscula, una minúscula y un número';
    }
    
    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Debes confirmar la contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
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
      const { confirmPassword, ...registerData } = formData;
      const result = await register({
        ...registerData,
        cedula: registerData.cedula.trim(),
        nombre: registerData.nombre.trim(),
        apellido: registerData.apellido.trim(),
        email: registerData.email.trim(),
        telefono: registerData.telefono.trim(),
        rol: 'estudiante' // Por defecto los registros son estudiantes
      });
      
      if (!result.success) {
        console.error('Register failed:', result.error);
      }
    } catch (err) {
      console.error('Register error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Container component="main" maxWidth="md">
        <Paper
          elevation={10}
          sx={{
            padding: { xs: 3, sm: 4, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Logo y título */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3
            }}
          >
            <School
              sx={{
                fontSize: 40,
                color: 'primary.main',
                mr: 1
              }}
            />
            <Typography
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main'
              }}
            >
              SPA Cursos
            </Typography>
          </Box>

          <Typography component="h2" variant="h5" gutterBottom>
            Crear Cuenta
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Regístrate como estudiante para acceder al sistema
          </Typography>

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
            sx={{ width: '100%' }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="cedula"
                  label="Cédula"
                  name="cedula"
                  autoComplete="off"
                  autoFocus
                  value={formData.cedula}
                  onChange={handleInputChange}
                  error={!!formErrors.cedula}
                  helperText={formErrors.cedula}
                  placeholder="Ejemplo: 1234567890"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="nombre"
                  label="Nombre"
                  name="nombre"
                  autoComplete="given-name"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  error={!!formErrors.nombre}
                  helperText={formErrors.nombre}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="apellido"
                  label="Apellido"
                  name="apellido"
                  autoComplete="family-name"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  error={!!formErrors.apellido}
                  helperText={formErrors.apellido}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Correo Electrónico"
                  name="email"
                  autoComplete="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  placeholder="ejemplo@correo.com"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="telefono"
                  label="Teléfono"
                  name="telefono"
                  autoComplete="tel"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  error={!!formErrors.telefono}
                  helperText={formErrors.telefono}
                  placeholder="3001234567"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(prev => !prev)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirmar Contraseña"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirmPassword(prev => !prev)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || isLoading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5
              }}
              startIcon={
                isSubmitting || isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <PersonAdd />
                )
              }
            >
              {isSubmitting || isLoading ? 'Creando Cuenta...' : 'Crear Cuenta'}
            </Button>

            {/* Link de login */}
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/login"
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Inicia sesión aquí
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;