import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tab,
  Tabs,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Grade as GradeIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import TaskService from '../../services/taskService';
import GradeService from '../../services/gradeService';
import CourseService from '../../services/courseService';
import { useAuth } from '../../context/AuthContext';

function TasksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskStudents, setTaskStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados para diálogos
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [gradeDialog, setGradeDialog] = useState(false);
  const [taskDetailDialog, setTaskDetailDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Estados para formularios
  const [taskForm, setTaskForm] = useState({
    titulo: '',
    descripcion: '',
    cursoId: '',
    tipo: '',
    peso: 1,
    fechaVencimiento: '',
    observaciones: ''
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    nota: '',
    observaciones: ''
  });

  const tiposEvaluacion = [
    { value: 'parcial', label: 'Parcial' },
    { value: 'final', label: 'Final' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'tarea', label: 'Tarea' },
    { value: 'proyecto', label: 'Proyecto' }
  ];

  useEffect(() => {
    loadInitialData();
  }, [user]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTasks(),
        loadCourses()
      ]);
    } catch (error) {
      setError('Error cargando datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      let response;
      if (user.rol === 'administrador') {
        response = await TaskService.getAllTasks();
      } else {
        response = await TaskService.getTeacherTasks();
      }
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      throw error;
    }
  };

  const loadCourses = async () => {
    try {
      let response;
      if (user.rol === 'administrador') {
        response = await CourseService.getAllCourses();
      } else {
        response = await CourseService.getTeacherCourses(user.cedula);
      }
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      throw error;
    }
  };

  const handleCreateTask = async () => {
    try {
      setLoading(true);
      await TaskService.createTask(taskForm);
      setSuccess('Tarea creada exitosamente');
      setCreateDialog(false);
      resetTaskForm();
      await loadTasks();
    } catch (error) {
      setError(error.response?.data?.message || 'Error creando tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = async () => {
    try {
      setLoading(true);
      await TaskService.updateTask(selectedTask.id, taskForm);
      setSuccess('Tarea actualizada exitosamente');
      setEditDialog(false);
      setSelectedTask(null);
      resetTaskForm();
      await loadTasks();
    } catch (error) {
      setError(error.response?.data?.message || 'Error actualizando tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    try {
      setLoading(true);
      await TaskService.deleteTask(selectedTask.id);
      setSuccess('Tarea eliminada exitosamente');
      setDeleteDialog(false);
      setSelectedTask(null);
      await loadTasks();
    } catch (error) {
      setError(error.response?.data?.message || 'Error eliminando tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTaskStudents = async (task) => {
    try {
      setLoading(true);
      const response = await TaskService.getTaskWithStudents(task.id);
      setSelectedTask(response.task);
      setTaskStudents(response.students || []);
      setTaskDetailDialog(true);
    } catch (error) {
      setError('Error cargando estudiantes de la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeStudent = (student) => {
    setSelectedStudent(student);
    if (student.calificacion) {
      setGradeForm({
        nota: student.calificacion.nota,
        observaciones: student.calificacion.observaciones || ''
      });
    } else {
      setGradeForm({
        nota: '',
        observaciones: ''
      });
    }
    setGradeDialog(true);
  };

  const handleSaveGrade = async () => {
    try {
      setLoading(true);
      
      if (selectedStudent.calificacion) {
        // Actualizar calificación existente
        await GradeService.updateGrade(selectedStudent.calificacion.id, {
          nota: parseFloat(gradeForm.nota),
          observaciones: gradeForm.observaciones
        });
        setSuccess('Calificación actualizada exitosamente');
      } else {
        // Crear nueva calificación
        await GradeService.createGrade({
          estudianteCedula: selectedStudent.cedula,
          cursoId: selectedTask.cursoId,
          taskId: selectedTask.id,
          nota: parseFloat(gradeForm.nota),
          profesorCedula: user.cedula,
          observaciones: gradeForm.observaciones
        });
        setSuccess('Calificación creada exitosamente');
      }

      setGradeDialog(false);
      setSelectedStudent(null);
      setGradeForm({ nota: '', observaciones: '' });
      
      // Recargar estudiantes de la tarea
      await handleViewTaskStudents(selectedTask);
    } catch (error) {
      setError(error.response?.data?.message || 'Error guardando calificación');
    } finally {
      setLoading(false);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      titulo: '',
      descripcion: '',
      cursoId: '',
      tipo: '',
      peso: 1,
      fechaVencimiento: '',
      observaciones: ''
    });
  };

  const openCreateDialog = () => {
    resetTaskForm();
    setCreateDialog(true);
  };

  const openEditDialog = (task) => {
    setSelectedTask(task);
    setTaskForm({
      titulo: task.titulo,
      descripcion: task.descripcion,
      cursoId: task.cursoId,
      tipo: task.tipo,
      peso: task.peso,
      fechaVencimiento: task.fechaVencimiento ? 
        new Date(task.fechaVencimiento.seconds ? task.fechaVencimiento.seconds * 1000 : task.fechaVencimiento)
          .toISOString().split('T')[0] : '',
      observaciones: task.observaciones || ''
    });
    setEditDialog(true);
  };

  const openDeleteDialog = (task) => {
    setSelectedTask(task);
    setDeleteDialog(true);
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'activa': return 'success';
      case 'cerrada': return 'error';
      case 'borrador': return 'warning';
      default: return 'default';
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

  if (loading && tasks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <AssignmentIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Gestión de Tareas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Nueva Tarea
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Mis Tareas" />
          <Tab label="Por Curso" />
          <Tab label="Estadísticas" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          {tasks.map((task) => (
            <Grid item xs={12} md={6} lg={4} key={task.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h2">
                      {task.titulo}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip 
                        label={task.tipo} 
                        color={getTipoColor(task.tipo)} 
                        size="small" 
                      />
                      <Chip 
                        label={task.estado} 
                        color={getStatusColor(task.estado)} 
                        size="small" 
                      />
                    </Stack>
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {task.descripcion}
                  </Typography>

                  <Box display="flex" alignItems="center" mb={1}>
                    <SchoolIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {task.curso?.nombre || 'Curso no encontrado'}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Peso: {task.peso}
                    </Typography>
                  </Box>

                  {task.fechaVencimiento && (
                    <Box display="flex" alignItems="center" mb={2}>
                      <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Vence: {new Date(task.fechaVencimiento.seconds ? 
                          task.fechaVencimiento.seconds * 1000 : task.fechaVencimiento)
                          .toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewTaskStudents(task)}
                  >
                    Ver Estudiantes
                  </Button>
                  <IconButton size="small" onClick={() => openEditDialog(task)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => openDeleteDialog(task)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {tasks.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No tienes tareas creadas
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={openCreateDialog}>
                  Crear Primera Tarea
                </Button>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Dialog para crear tarea */}
      <Dialog 
        open={createDialog} 
        onClose={() => setCreateDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 2 }} />
            Nueva Tarea
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Información Básica
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título de la Tarea"
                  placeholder="Ej: Parcial 1 - Fundamentos de Programación"
                  value={taskForm.titulo}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, titulo: e.target.value }))}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descripción de la Tarea"
                  placeholder="Describe detalladamente qué deben hacer los estudiantes, criterios de evaluación, recursos necesarios, etc."
                  value={taskForm.descripcion}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Configuración del Curso
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Seleccionar Curso</InputLabel>
                  <Select
                    value={taskForm.cursoId}
                    label="Seleccionar Curso"
                    onChange={(e) => setTaskForm(prev => ({ ...prev, cursoId: e.target.value }))}
                  >
                    <MenuItem value="">
                      <em>-- Selecciona un curso --</em>
                    </MenuItem>
                    {courses.map(course => (
                      <MenuItem key={course.id} value={course.id}>
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {course.nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {course.carrera} • {course.modalidad}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Configuración de Evaluación
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Tipo de Evaluación</InputLabel>
                  <Select
                    value={taskForm.tipo}
                    label="Tipo de Evaluación"
                    onChange={(e) => setTaskForm(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    <MenuItem value="">
                      <em>-- Selecciona el tipo --</em>
                    </MenuItem>
                    {tiposEvaluacion.map(tipo => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        <Box display="flex" alignItems="center">
                          <Chip 
                            label={tipo.label} 
                            size="small" 
                            color={getTipoColor(tipo.value)}
                            sx={{ mr: 2 }}
                          />
                          {tipo.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Peso de la Evaluación"
                  helperText="Define la importancia de esta tarea en la nota final"
                  value={taskForm.peso}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, peso: parseFloat(e.target.value) || 1 }))}
                  inputProps={{ min: 0.1, step: 0.1, max: 10 }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Configuración de Fechas
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Vencimiento"
                  helperText="Fecha límite para la entrega (opcional)"
                  value={taskForm.fechaVencimiento}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box 
                  sx={{ 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <CalendarIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Fecha de Creación
                  </Typography>
                  <Typography variant="body1">
                    {new Date().toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              Observaciones Adicionales
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observaciones"
                  placeholder="Instrucciones especiales, recursos adicionales, criterios de evaluación específicos..."
                  value={taskForm.observaciones}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, observaciones: e.target.value }))}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setCreateDialog(false)}
            size="large"
            sx={{ mr: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateTask} 
            disabled={loading || !taskForm.titulo || !taskForm.descripcion || !taskForm.cursoId || !taskForm.tipo}
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIcon />}
          >
            {loading ? 'Creando...' : 'Crear Tarea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar tarea */}
      <Dialog 
        open={editDialog} 
        onClose={() => setEditDialog(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle sx={{ pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 2 }} />
            Editar Tarea
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Información Básica
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título de la Tarea"
                  value={taskForm.titulo}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, titulo: e.target.value }))}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descripción de la Tarea"
                  value={taskForm.descripcion}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Configuración de Evaluación
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Tipo de Evaluación</InputLabel>
                  <Select
                    value={taskForm.tipo}
                    label="Tipo de Evaluación"
                    onChange={(e) => setTaskForm(prev => ({ ...prev, tipo: e.target.value }))}
                  >
                    {tiposEvaluacion.map(tipo => (
                      <MenuItem key={tipo.value} value={tipo.value}>
                        <Box display="flex" alignItems="center">
                          <Chip 
                            label={tipo.label} 
                            size="small" 
                            color={getTipoColor(tipo.value)}
                            sx={{ mr: 2 }}
                          />
                          {tipo.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Peso de la Evaluación"
                  helperText="Define la importancia de esta tarea en la nota final"
                  value={taskForm.peso}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, peso: parseFloat(e.target.value) || 1 }))}
                  inputProps={{ min: 0.1, step: 0.1, max: 10 }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Configuración de Fechas
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Vencimiento"
                  helperText="Fecha límite para la entrega (opcional)"
                  value={taskForm.fechaVencimiento}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, fechaVencimiento: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box 
                  sx={{ 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'divider', 
                    borderRadius: 1,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <CalendarIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                    Fecha de Creación
                  </Typography>
                  <Typography variant="body1">
                    {selectedTask?.fechaCreacion ? 
                      new Date(selectedTask.fechaCreacion.seconds ? 
                        selectedTask.fechaCreacion.seconds * 1000 : selectedTask.fechaCreacion)
                        .toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) 
                      : 'No disponible'
                    }
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              Observaciones Adicionales
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observaciones"
                  value={taskForm.observaciones}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, observaciones: e.target.value }))}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setEditDialog(false)}
            size="large"
            sx={{ mr: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleEditTask} 
            disabled={loading || !taskForm.titulo || !taskForm.descripcion || !taskForm.tipo}
            size="large"
            startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {loading ? 'Actualizando...' : 'Actualizar Tarea'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver estudiantes de la tarea */}
      <Dialog open={taskDetailDialog} onClose={() => setTaskDetailDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedTask?.titulo} - Estudiantes
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Calificación</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taskStudents.map((student) => (
                  <TableRow key={student.cedula}>
                    <TableCell>
                      {student.nombre} {student.apellido}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {student.cedula}
                      </Typography>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      {student.calificacion ? (
                        <Chip 
                          label={student.calificacion.nota.toFixed(1)} 
                          color={student.calificacion.nota >= 3 ? 'success' : 'error'}
                          size="small"
                        />
                      ) : (
                        <Chip label="Sin calificar" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={student.calificacion?.estado || 'Pendiente'} 
                        color={student.calificacion?.estado === 'definitiva' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Calificar">
                        <IconButton onClick={() => handleGradeStudent(student)}>
                          <GradeIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDetailDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para calificar estudiante */}
      <Dialog open={gradeDialog} onClose={() => setGradeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Calificar a {selectedStudent?.nombre} {selectedStudent?.apellido}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Nota (0-5)"
                value={gradeForm.nota}
                onChange={(e) => setGradeForm(prev => ({ ...prev, nota: e.target.value }))}
                inputProps={{ min: 0, max: 5, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones"
                value={gradeForm.observaciones}
                onChange={(e) => setGradeForm(prev => ({ ...prev, observaciones: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveGrade} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Guardar Calificación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para eliminar tarea */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la tarea "{selectedTask?.titulo}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancelar</Button>
          <Button color="error" onClick={handleDeleteTask} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TasksPage;