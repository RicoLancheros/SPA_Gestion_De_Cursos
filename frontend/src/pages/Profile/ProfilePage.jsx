import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Save, Edit, Cancel } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        telefono: user.telefono || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success('Perfil actualizado exitosamente');
        setIsEditing(false);
      } else {
        toast.error(result.error || 'Error actualizando perfil');
      }
    } catch (error) {
      toast.error('Error actualizando perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (result.success) {
        toast.success('Contraseña cambiada exitosamente');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
      } else {
        toast.error(result.error || 'Error cambiando contraseña');
      }
    } catch (error) {
      toast.error('Error cambiando contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      telefono: user.telefono || ''
    });
    setIsEditing(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'administrador':
        return 'error';
      case 'profesor':
        return 'warning';
      case 'estudiante':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>

      {/* Información básica */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: '2rem',
              bgcolor: 'primary.main',
              mr: 3
            }}
          >
            {user?.nombre?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5">
              {user?.nombre} {user?.apellido}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Cédula: {user?.cedula}
            </Typography>
            <Chip
              label={user?.rol?.toUpperCase()}
              color={getRoleColor(user?.rol)}
              size="small"
            />
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nombre"
              name="nombre"
              value={profileData.nombre}
              onChange={handleProfileChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Apellido"
              name="apellido"
              value={profileData.apellido}
              onChange={handleProfileChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={profileData.email}
              onChange={handleProfileChange}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Teléfono"
              name="telefono"
              value={profileData.telefono}
              onChange={handleProfileChange}
              disabled={!isEditing}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          {isEditing ? (
            <>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Guardar'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => setIsEditing(true)}
            >
              Editar Perfil
            </Button>
          )}
        </Box>
      </Paper>

      {/* Cambiar contraseña */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cambiar Contraseña
        </Typography>

        {!showPasswordForm ? (
          <Button
            variant="outlined"
            onClick={() => setShowPasswordForm(true)}
          >
            Cambiar Contraseña
          </Button>
        ) : (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              La nueva contraseña debe tener al menos 8 caracteres.
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contraseña Actual"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nueva Contraseña"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirmar Nueva Contraseña"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Cambiar Contraseña'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ProfilePage;