import { Box, Typography, Paper } from '@mui/material';
import { Grade } from '@mui/icons-material';

const GradesPage = ({ teacherMode = false }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Grade sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h4">
          {teacherMode ? 'Mis Calificaciones' : 'Gestión de Calificaciones'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Página en Construcción
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {teacherMode 
            ? 'Aquí puedes registrar y gestionar las calificaciones de tus estudiantes.'
            : 'Supervisa y gestiona todas las calificaciones del sistema, genera reportes y estadísticas.'
          }
        </Typography>
      </Paper>
    </Box>
  );
};

export default GradesPage;