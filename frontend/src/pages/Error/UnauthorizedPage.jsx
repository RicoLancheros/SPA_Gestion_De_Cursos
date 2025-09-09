import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Lock, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            width: '100%'
          }}
          elevation={3}
        >
          <Lock
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 2
            }}
          />
          
          <Typography variant="h3" component="h1" gutterBottom color="error">
            403
          </Typography>
          
          <Typography variant="h5" component="h2" gutterBottom>
            Acceso Denegado
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            No tienes permisos para acceder a esta página.
            {user?.rol && (
              <>
                <br />
                Tu rol actual es: <strong>{user.rol.toUpperCase()}</strong>
              </>
            )}
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={handleGoHome}
            sx={{ mt: 2 }}
          >
            {isAuthenticated ? 'Ir al Dashboard' : 'Iniciar Sesión'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default UnauthorizedPage;