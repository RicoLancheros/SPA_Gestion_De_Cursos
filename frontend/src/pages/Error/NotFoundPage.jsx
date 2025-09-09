import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Search, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/');
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
          <Search
            sx={{
              fontSize: 80,
              color: 'warning.main',
              mb: 2
            }}
          />
          
          <Typography variant="h3" component="h1" gutterBottom color="warning.main">
            404
          </Typography>
          
          <Typography variant="h5" component="h2" gutterBottom>
            Página No Encontrada
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            La página que buscas no existe o ha sido movida.
            <br />
            Verifica la URL e intenta nuevamente.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<Home />}
            onClick={handleGoHome}
            sx={{ mt: 2 }}
          >
            {isAuthenticated ? 'Ir al Dashboard' : 'Ir al Inicio'}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFoundPage;