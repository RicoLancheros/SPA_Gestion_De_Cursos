import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  People,
  School,
  Assignment,
  Grade,
  TrendingUp,
  Schedule
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import UserService from '../../services/userService';
import CourseService from '../../services/courseService';
import EnrollmentService from '../../services/enrollmentService';
import GradeService from '../../services/gradeService';

// Componente de estadística en línea
const StatItem = ({ title, value, icon, color = 'primary' }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'flex-start',
    gap: 2,
    p: 2,
    borderRadius: 2,
    backgroundColor: 'background.paper',
    transition: 'all 0.2s ease',
    height: '80px', // Altura fija para que todos sean iguales
    width: '100%',
    '&:hover': {
      backgroundColor: 'action.hover',
      transform: 'scale(1.02)'
    }
  }}>
    <Avatar 
      sx={{ 
        bgcolor: `${color}.main`,
        width: 48,
        height: 48,
        flexShrink: 0
      }}
    >
      {icon}
    </Avatar>
    <Box sx={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
      <Typography 
        variant="h4" 
        component="div" 
        fontWeight="bold"
        color="primary"
        sx={{ lineHeight: 1, mb: 0.5, fontSize: '1.8rem' }}
      >
        {value}
      </Typography>
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          fontWeight: 500,
          fontSize: '0.85rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {title}
      </Typography>
    </Box>
  </Box>
);

const Dashboard = () => {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const statsData = {};

      if (isAdmin) {
        // Cargar estadísticas para administrador
        const [userStats, courseStats, enrollmentStats, gradeStats] = await Promise.all([
          UserService.getUserStats().catch(() => ({ stats: {} })),
          CourseService.getCourseStats().catch(() => ({ stats: {} })),
          EnrollmentService.getEnrollmentStats().catch(() => ({ stats: {} })),
          GradeService.getGradeStats().catch(() => ({ stats: {} }))
        ]);

        statsData.totalUsers = userStats.stats?.totalUsers || 0;
        statsData.totalStudents = userStats.stats?.totalStudents || 0;
        statsData.totalTeachers = userStats.stats?.totalTeachers || 0;
        statsData.totalCourses = courseStats.stats?.totalCourses || 0;
        statsData.activeCourses = courseStats.stats?.activeCourses || 0;
        statsData.totalEnrollments = enrollmentStats.stats?.totalEnrollments || 0;
        statsData.activeEnrollments = enrollmentStats.stats?.activeEnrollments || 0;
        statsData.totalGrades = gradeStats.stats?.totalGrades || 0;

      } else if (isTeacher) {
        // Cargar estadísticas para profesor
        const [myCourses, enrollmentStats, gradeStats] = await Promise.all([
          CourseService.getTeacherCourses(user.cedula).catch(() => ({ data: [] })),
          EnrollmentService.getEnrollmentStats({ docenteCedula: user.cedula }).catch(() => ({ stats: {} })),
          GradeService.getGradeStats({ docenteCedula: user.cedula }).catch(() => ({ stats: {} }))
        ]);

        statsData.myCourses = myCourses.data?.length || 0;
        statsData.myStudents = enrollmentStats.stats?.totalStudents || 0;
        statsData.myEnrollments = enrollmentStats.stats?.totalEnrollments || 0;
        statsData.myGrades = gradeStats.stats?.totalGrades || 0;

      } else if (isStudent) {
        // Cargar estadísticas para estudiante
        const [myEnrollments, myGrades, availableCourses] = await Promise.all([
          EnrollmentService.getMyEnrollments().catch(() => ({ data: [] })),
          GradeService.getStudentGrades(user.cedula).catch(() => ({ data: [] })),
          CourseService.getAvailableCourses().catch(() => ({ data: [] }))
        ]);

        statsData.myEnrollments = myEnrollments.data?.length || 0;
        statsData.activeEnrollments = myEnrollments.data?.filter(e => e.estado === 'activo').length || 0;
        statsData.myGrades = myGrades.data?.length || 0;
        statsData.availableCourses = availableCourses.data?.length || 0;
      }

      setStats(statsData);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError('Error cargando la información del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const renderAdminDashboard = () => (
    <Box>
      {/* Alert informativo */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          borderRadius: 2 
        }}
      >
        Bienvenido al panel de administración. Tienes acceso completo al sistema.
      </Alert>

      {/* Estadísticas en línea */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
          Estadísticas del Sistema
        </Typography>
        <Grid container spacing={3} sx={{ justifyContent: 'center', alignItems: 'stretch' }}>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Total de Usuarios"
              value={stats.totalUsers || 0}
              icon={<People />}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Total de Cursos"
              value={stats.totalCourses || 0}
              icon={<School />}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Total de Matrículas"
              value={stats.totalEnrollments || 0}
              icon={<Assignment />}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Total de Calificaciones"
              value={stats.totalGrades || 0}
              icon={<Grade />}
              color="info"
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  const renderTeacherDashboard = () => (
    <Box>
      {/* Alert informativo */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          borderRadius: 2 
        }}
      >
        Panel del profesor. Gestiona tus cursos y estudiantes asignados.
      </Alert>

      {/* Estadísticas en línea */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
          Mi Panel de Profesor
        </Typography>
        <Grid container spacing={3} sx={{ justifyContent: 'center', alignItems: 'stretch' }}>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Mis Cursos Asignados"
              value={stats.myCourses || 0}
              icon={<School />}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Total de Estudiantes"
              value={stats.myStudents || 0}
              icon={<People />}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Matrículas Activas"
              value={stats.myEnrollments || 0}
              icon={<Assignment />}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Calificaciones Registradas"
              value={stats.myGrades || 0}
              icon={<Grade />}
              color="info"
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  const renderStudentDashboard = () => (
    <Box>
      {/* Alert informativo */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          borderRadius: 2 
        }}
      >
        Panel del estudiante. Consulta tus inscripciones y calificaciones.
      </Alert>

      {/* Estadísticas en línea */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
          Mi Panel de Estudiante
        </Typography>
        <Grid container spacing={3} sx={{ justifyContent: 'center', alignItems: 'stretch' }}>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Mis Inscripciones"
              value={stats.myEnrollments || 0}
              icon={<Assignment />}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Mis Calificaciones"
              value={stats.myGrades || 0}
              icon={<Grade />}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Cursos Disponibles"
              value={stats.availableCourses || 0}
              icon={<School />}
              color="info"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3} sx={{ display: 'flex' }}>
            <StatItem
              title="Progreso"
              value={`${Math.round(((stats.activeEnrollments || 0) / Math.max((stats.myEnrollments || 0), 1)) * 100)}%`}
              icon={<TrendingUp />}
              color="warning"
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 60, height: 60 }}>
            {user?.nombre?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              ¡Hola, {user?.nombre}!
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={user?.rol?.toUpperCase()}
                color={
                  user?.rol === 'administrador' ? 'error' :
                  user?.rol === 'profesor' ? 'warning' : 'info'
                }
              />
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule fontSize="small" />
                Último acceso: {new Date(user?.fechaUltimoAcceso?._seconds * 1000).toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Bienvenido al Sistema de Gestión de Cursos del SENA
        </Typography>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard content based on role */}
      {isAdmin && renderAdminDashboard()}
      {isTeacher && renderTeacherDashboard()}
      {isStudent && renderStudentDashboard()}
    </Box>
  );
};

export default Dashboard;