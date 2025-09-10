import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Grade as GradeIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import TaskService from '../../services/taskService';
import { useAuth } from '../../context/AuthContext';

function StudentTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    calificadas: 0,
    pendientes: 0,
    promedio: 0
  });

  useEffect(() => {
    if (user?.cedula) {
      loadStudentTasks();
    }
  }, [user]);

  const loadStudentTasks = async () => {
    try {
      setLoading(true);
      const response = await TaskService.getStudentTasks(user.cedula);
      const tasksData = response.data || [];
      setTasks(tasksData);
      
      // Calcular estadísticas
      const total = tasksData.length;
      const calificadas = tasksData.filter(task => task.calificacion).length;
      const pendientes = total - calificadas;
      const promedio = calificadas > 0 
        ? tasksData
            .filter(task => task.calificacion)
            .reduce((sum, task) => sum + task.calificacion.nota, 0) / calificadas
        : 0;

      setStats({ total, calificadas, pendientes, promedio });
    } catch (error) {
      console.error('Error loading student tasks:', error);
      setError('Error cargando las tareas');
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'parcial': return 'primary';
      case 'final': return 'error';
      case 'quiz': return 'info';
      case 'tarea': return 'success';
      case 'proyecto': return 'warning';
      default: return 'default';
    }
  };

  const getGradeColor = (nota) => {
    if (nota >= 4.5) return 'success';
    if (nota >= 3.5) return 'primary';
    if (nota >= 3.0) return 'warning';
    return 'error';
  };

  const isOverdue = (fechaVencimiento) => {
    if (!fechaVencimiento) return false;
    const vencimiento = new Date(fechaVencimiento.seconds ? 
      fechaVencimiento.seconds * 1000 : fechaVencimiento);
    return vencimiento < new Date();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          <AssignmentIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Mis Tareas
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Revisa tus tareas asignadas y calificaciones
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AssignmentIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.total}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Tareas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.calificadas}
                  </Typography>
                  <Typography color="text.secondary">
                    Calificadas
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PendingIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.pendientes}
                  </Typography>
                  <Typography color="text.secondary">
                    Pendientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <GradeIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.promedio.toFixed(1)}
                  </Typography>
                  <Typography color="text.secondary">
                    Promedio
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Barra de progreso */}
      {stats.total > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Progreso General
          </Typography>
          <Box display="flex" alignItems="center" mb={1}>
            <Box width="100%" mr={1}>
              <LinearProgress 
                variant="determinate" 
                value={(stats.calificadas / stats.total) * 100}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Box minWidth={35}>
              <Typography variant="body2" color="text.secondary">
                {Math.round((stats.calificadas / stats.total) * 100)}%
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {stats.calificadas} de {stats.total} tareas completadas
          </Typography>
        </Paper>
      )}

      {/* Lista de tareas */}
      <Grid container spacing={3}>
        {tasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <Card 
              sx={{ 
                height: '100%',
                border: isOverdue(task.fechaVencimiento) && !task.calificacion 
                  ? '2px solid' 
                  : 'none',
                borderColor: 'error.main',
                position: 'relative'
              }}
            >
              {isOverdue(task.fechaVencimiento) && !task.calificacion && (
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1
                  }}
                >
                  <Chip 
                    icon={<WarningIcon />}
                    label="Vencida" 
                    color="error" 
                    size="small" 
                  />
                </Box>
              )}

              <CardContent sx={{ pb: 2 }}>
                <Box mb={2}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {task.titulo}
                  </Typography>
                  <Stack direction="row" spacing={1} mb={2}>
                    <Chip 
                      label={task.tipo} 
                      color={getTipoColor(task.tipo)} 
                      size="small" 
                    />
                    <Chip 
                      label={`Peso: ${task.peso}`} 
                      variant="outlined"
                      size="small" 
                    />
                  </Stack>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {task.descripcion}
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Información del curso */}
                <Box display="flex" alignItems="center" mb={1}>
                  <SchoolIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {task.curso?.nombre || 'Curso no disponible'}
                  </Typography>
                </Box>

                {/* Información del profesor */}
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Prof. {task.profesor?.nombre} {task.profesor?.apellido}
                  </Typography>
                </Box>

                {/* Fecha de vencimiento */}
                {task.fechaVencimiento && (
                  <Box display="flex" alignItems="center" mb={2}>
                    <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2" 
                      color={isOverdue(task.fechaVencimiento) ? 'error' : 'text.secondary'}
                    >
                      Vence: {new Date(task.fechaVencimiento.seconds ? 
                        task.fechaVencimiento.seconds * 1000 : task.fechaVencimiento)
                        .toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Calificación */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Calificación:
                  </Typography>
                  {task.calificacion ? (
                    <Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Chip 
                          icon={<GradeIcon />}
                          label={`${task.calificacion.nota.toFixed(1)} / 5.0`}
                          color={getGradeColor(task.calificacion.nota)}
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          ({task.calificacion.nota >= 3 ? 'Aprobado' : 'Reprobado'})
                        </Typography>
                      </Box>
                      
                      {task.calificacion.observaciones && (
                        <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.paper' }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            <strong>Observaciones del profesor:</strong>
                          </Typography>
                          <Typography variant="body2">
                            {task.calificacion.observaciones}
                          </Typography>
                        </Paper>
                      )}

                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Calificado el {new Date(task.calificacion.fechaRegistro?.seconds ? 
                          task.calificacion.fechaRegistro.seconds * 1000 : task.calificacion.fechaRegistro)
                          .toLocaleDateString()}
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Chip 
                        icon={<PendingIcon />}
                        label="Sin calificar" 
                        color="default" 
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Tu profesor aún no ha calificado esta tarea
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {tasks.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tienes tareas asignadas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Las tareas aparecerán aquí cuando tus profesores las creen
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default StudentTasksPage;