import { Box, Typography, Paper } from '@mui/material';
import { Assignment } from '@mui/icons-material';

const EnrollmentsPage = ({ studentMode = false }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Assignment sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h4">
          {studentMode ? 'Mis Inscripciones' : 'Gestión de Matrículas'}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, textAlign: 'center', minHeight: 400 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Página en Construcción
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {studentMode 
            ? 'Aquí puedes ver todas tus inscripciones y gestionar retiros dentro del plazo de 24 horas.'
            : 'Gestiona las matrículas de estudiantes en el sistema, supervisa inscripciones y retiros.'
          }
        </Typography>
      </Paper>
    </Box>
  );
};

export default EnrollmentsPage;