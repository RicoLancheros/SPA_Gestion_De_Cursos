import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, 
  TableCell, TableContainer, Card, CardContent, Chip, Alert,
  FormControl, InputLabel, Select, MenuItem, Grid, Divider,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, CircularProgress
} from '@mui/material';
import {
  Grade, School, Assessment, TrendingUp, Star,
  FilterList, Visibility, Add, Edit, Delete
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import GradeService from '../../services/gradeService';
import CourseService from '../../services/courseService';
import UserService from '../../services/userService';
import { toast } from 'react-toastify';

const GradesPage = ({ studentMode = false, teacherMode = false }) => {
  // Estados principales
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  // Estados de filtros
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');

  // Estados de diálogos
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    estudianteCedula: '',
    cursoId: '',
    nota: '',
    tipo: 'parcial',
    descripcion: '',
    peso: 1,
    observaciones: '',
    fechaEvaluacion: new Date().toISOString().split('T')[0]
  });
  const [formErrors, setFormErrors] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (studentMode) {
        // Vista de estudiante: solo sus notas
        const response = await GradeService.getStudentReport(user.cedula);
        setGrades(response.grades || []);
        setStats(response.stats || null);
      } else if (teacherMode) {
        // Vista de profesor: notas de sus cursos
        const coursesResponse = await CourseService.getAllCourses({ docenteAsignado: user.cedula });
        setCourses(coursesResponse.data || []);
        
        if (coursesResponse.data && coursesResponse.data.length > 0) {
          const allGrades = [];
          for (const course of coursesResponse.data) {
            const gradeResponse = await GradeService.getCourseGrades(course.id);
            allGrades.push(...(gradeResponse.data || []));
          }
          setGrades(allGrades);
        }
      } else {
        // Vista de administrador: todas las notas
        const [gradesResponse, coursesResponse, studentsResponse, statsResponse] = await Promise.all([
          GradeService.getAllGrades(),
          CourseService.getAllCourses(),
          UserService.getAllUsers({ rol: 'estudiante' }),
          GradeService.getGradeStats()
        ]);
        
        setGrades(gradesResponse.data || []);
        setCourses(coursesResponse.data || []);
        setStudents(studentsResponse.data || []);
        setStats(statsResponse.stats || null);
      }
    } catch (err) {
      console.error('Error loading grades:', err);
      setError(err.message || 'Error al cargar calificaciones');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar calificaciones
  const filteredGrades = grades.filter(grade => {
    if (selectedCourse !== 'all' && grade.cursoId !== selectedCourse) return false;
    if (selectedType !== 'all' && grade.tipo !== selectedType) return false;
    if (selectedStudent !== 'all' && grade.estudianteCedula !== selectedStudent) return false;
    return true;
  });

  // Manejar cambios en formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar errores al cambiar
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Abrir diálogo
  const handleOpenDialog = (mode, grade = null) => {
    setDialogMode(mode);
    setSelectedGrade(grade);
    
    if (mode === 'create') {
      setFormData({
        estudianteCedula: '',
        cursoId: '',
        nota: '',
        tipo: 'parcial',
        descripcion: '',
        peso: 1,
        observaciones: '',
        fechaEvaluacion: new Date().toISOString().split('T')[0]
      });
    } else if (mode === 'edit' && grade) {
      setFormData({
        estudianteCedula: grade.estudianteCedula || '',
        cursoId: grade.cursoId || '',
        nota: grade.nota?.toString() || '',
        tipo: grade.tipo || 'parcial',
        descripcion: grade.descripcion || '',
        peso: grade.peso || 1,
        observaciones: grade.observaciones || '',
        fechaEvaluacion: grade.fechaEvaluacion ? 
          new Date(grade.fechaEvaluacion._seconds ? grade.fechaEvaluacion._seconds * 1000 : grade.fechaEvaluacion)
            .toISOString().split('T')[0] : 
          new Date().toISOString().split('T')[0]
      });
    }
    
    setFormErrors({});
    setOpenDialog(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedGrade(null);
    setFormData({
      estudianteCedula: '',
      cursoId: '',
      nota: '',
      tipo: 'parcial',
      descripcion: '',
      peso: 1,
      observaciones: '',
      fechaEvaluacion: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formData.estudianteCedula) errors.estudianteCedula = 'Estudiante requerido';
    if (!formData.cursoId) errors.cursoId = 'Curso requerido';
    if (!formData.nota) errors.nota = 'Nota requerida';
    if (!formData.descripcion) errors.descripcion = 'Descripción requerida';
    
    const nota = parseFloat(formData.nota);
    if (isNaN(nota) || nota < 0 || nota > 5) {
      errors.nota = 'La nota debe ser un número entre 0 y 5';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const gradeData = {
        ...formData,
        nota: parseFloat(formData.nota),
        peso: parseFloat(formData.peso || 1),
        fechaEvaluacion: new Date(formData.fechaEvaluacion)
      };
      
      let response;
      if (dialogMode === 'create') {
        response = await GradeService.createGrade(gradeData);
      } else if (dialogMode === 'edit') {
        response = await GradeService.updateGrade(selectedGrade.id, gradeData);
      }
      
      if (response.success) {
        toast.success(
          dialogMode === 'create' ? 'Calificación creada exitosamente' : 'Calificación actualizada exitosamente'
        );
        handleCloseDialog();
        loadData();
      }
    } catch (err) {
      console.error('Error saving grade:', err);
      toast.error(err.message || 'Error al guardar calificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar calificación
  const handleDelete = async (gradeId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta calificación?')) return;
    
    try {
      const response = await GradeService.deleteGrade(gradeId);
      if (response.success) {
        toast.success('Calificación eliminada exitosamente');
        loadData();
      }
    } catch (err) {
      console.error('Error deleting grade:', err);
      toast.error(err.message || 'Error al eliminar calificación');
    }
  };

  // Obtener color según nota
  const getGradeColor = (nota) => {
    if (nota >= 4.5) return 'success';
    if (nota >= 4.0) return 'info';
    if (nota >= 3.0) return 'warning';
    return 'error';
  };

  // Obtener color según tipo de evaluación
  const getTypeColor = (tipo) => {
    const colors = {
      'parcial': 'primary',
      'final': 'error',
      'quiz': 'info',
      'tarea': 'success'
    };
    return colors[tipo] || 'default';
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
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Grade sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4">
            {studentMode ? 'Mis Calificaciones' : teacherMode ? 'Calificaciones de Mis Cursos' : 'Gestión de Calificaciones'}
          </Typography>
        </Box>
        
        {(teacherMode || (!studentMode && !teacherMode)) && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('create')}
            sx={{ borderRadius: 0 }}
          >
            Nueva Calificación
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Estadísticas para estudiantes */}
      {studentMode && stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {stats.totalMaterias || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Materias Cursadas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assessment color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {stats.totalEvaluaciones || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Evaluaciones
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {stats.promedioGeneral || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Promedio General
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Star color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {stats.materiasAprobadas || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Materias Aprobadas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FilterList sx={{ color: 'text.secondary' }} />
          
          {!studentMode && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Curso</InputLabel>
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                label="Curso"
                sx={{ borderRadius: 0 }}
              >
                <MenuItem value="all">Todos los cursos</MenuItem>
                {courses.map(course => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="Tipo"
              sx={{ borderRadius: 0 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="parcial">Parcial</MenuItem>
              <MenuItem value="final">Final</MenuItem>
              <MenuItem value="quiz">Quiz</MenuItem>
              <MenuItem value="tarea">Tarea</MenuItem>
            </Select>
          </FormControl>
          
          {!studentMode && !teacherMode && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Estudiante</InputLabel>
              <Select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                label="Estudiante"
                sx={{ borderRadius: 0 }}
              >
                <MenuItem value="all">Todos los estudiantes</MenuItem>
                {students.map(student => (
                  <MenuItem key={student.cedula} value={student.cedula}>
                    {student.nombre} {student.apellido}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Paper>

      {/* Tabla de calificaciones */}
      <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
        <Table>
          <TableHead>
            <TableRow>
              {!studentMode && <TableCell>Estudiante</TableCell>}
              <TableCell>Curso</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="center">Tipo</TableCell>
              <TableCell align="center">Nota</TableCell>
              <TableCell align="center">Peso</TableCell>
              <TableCell>Fecha</TableCell>
              {!studentMode && <TableCell>Profesor</TableCell>}
              {(teacherMode || (!studentMode && !teacherMode)) && (
                <TableCell align="center">Acciones</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGrades.map((grade) => (
              <TableRow key={grade.id} hover>
                {!studentMode && (
                  <TableCell>
                    {grade.estudiante ? 
                      `${grade.estudiante.nombre} ${grade.estudiante.apellido}` : 
                      grade.estudianteCedula
                    }
                  </TableCell>
                )}
                <TableCell>
                  {grade.curso ? grade.curso.nombre : 'Curso no encontrado'}
                </TableCell>
                <TableCell>{grade.descripcion}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={grade.tipo.toUpperCase()}
                    size="small"
                    color={getTypeColor(grade.tipo)}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={grade.nota.toFixed(1)}
                    size="small"
                    color={getGradeColor(grade.nota)}
                    variant="filled"
                  />
                </TableCell>
                <TableCell align="center">{grade.peso}</TableCell>
                <TableCell>
                  {grade.fechaEvaluacion ? 
                    new Date(grade.fechaEvaluacion._seconds ? 
                      grade.fechaEvaluacion._seconds * 1000 : 
                      grade.fechaEvaluacion
                    ).toLocaleDateString('es-ES') : 
                    'Sin fecha'
                  }
                </TableCell>
                {!studentMode && (
                  <TableCell>
                    {grade.profesor ? 
                      `${grade.profesor.nombre} ${grade.profesor.apellido}` : 
                      grade.profesorCedula
                    }
                  </TableCell>
                )}
                {(teacherMode || (!studentMode && !teacherMode)) && (
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton size="small" onClick={() => handleOpenDialog('view', grade)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenDialog('edit', grade)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!studentMode && !teacherMode && (
                      <Tooltip title="Eliminar">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(grade.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            
            {filteredGrades.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={studentMode ? 6 : (teacherMode ? 8 : 9)} 
                  align="center" 
                  sx={{ py: 4 }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No se encontraron calificaciones
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo para crear/editar/ver calificaciones */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Nueva Calificación'}
          {dialogMode === 'edit' && 'Editar Calificación'}
          {dialogMode === 'view' && 'Detalles de la Calificación'}
        </DialogTitle>
        
        <DialogContent>
          {dialogMode === 'view' ? (
            // Vista de detalles
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Estudiante:</Typography>
                  <Typography variant="body1">
                    {selectedGrade?.estudiante ? 
                      `${selectedGrade.estudiante.nombre} ${selectedGrade.estudiante.apellido}` : 
                      selectedGrade?.estudianteCedula
                    }
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Curso:</Typography>
                  <Typography variant="body1">
                    {selectedGrade?.curso?.nombre || 'Curso no encontrado'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Tipo:</Typography>
                  <Chip
                    label={selectedGrade?.tipo?.toUpperCase()}
                    size="small"
                    color={getTypeColor(selectedGrade?.tipo)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Nota:</Typography>
                  <Chip
                    label={selectedGrade?.nota?.toFixed(1)}
                    size="medium"
                    color={getGradeColor(selectedGrade?.nota)}
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Descripción:</Typography>
                  <Typography variant="body1">{selectedGrade?.descripcion}</Typography>
                </Grid>
                {selectedGrade?.observaciones && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Observaciones:</Typography>
                    <Typography variant="body1">{selectedGrade.observaciones}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Peso:</Typography>
                  <Typography variant="body1">{selectedGrade?.peso}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Fecha de Evaluación:</Typography>
                  <Typography variant="body1">
                    {selectedGrade?.fechaEvaluacion ? 
                      new Date(selectedGrade.fechaEvaluacion._seconds ? 
                        selectedGrade.fechaEvaluacion._seconds * 1000 : 
                        selectedGrade.fechaEvaluacion
                      ).toLocaleDateString('es-ES') : 
                      'Sin fecha'
                    }
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ) : (
            // Formulario de creación/edición
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.estudianteCedula}>
                    <InputLabel>Estudiante</InputLabel>
                    <Select
                      name="estudianteCedula"
                      value={formData.estudianteCedula}
                      onChange={handleInputChange}
                      label="Estudiante"
                      disabled={dialogMode === 'view'}
                      sx={{ borderRadius: 0 }}
                    >
                      {students.map(student => (
                        <MenuItem key={student.cedula} value={student.cedula}>
                          {student.nombre} {student.apellido} - {student.cedula}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth error={!!formErrors.cursoId}>
                    <InputLabel>Curso</InputLabel>
                    <Select
                      name="cursoId"
                      value={formData.cursoId}
                      onChange={handleInputChange}
                      label="Curso"
                      disabled={dialogMode === 'view'}
                      sx={{ borderRadius: 0 }}
                    >
                      {courses.map(course => (
                        <MenuItem key={course.id} value={course.id}>
                          {course.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="nota"
                    label="Nota (0-5)"
                    type="number"
                    value={formData.nota}
                    onChange={handleInputChange}
                    error={!!formErrors.nota}
                    helperText={formErrors.nota}
                    disabled={dialogMode === 'view'}
                    fullWidth
                    inputProps={{ min: 0, max: 5, step: 0.1 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Evaluación</InputLabel>
                    <Select
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleInputChange}
                      label="Tipo de Evaluación"
                      disabled={dialogMode === 'view'}
                      sx={{ borderRadius: 0 }}
                    >
                      <MenuItem value="parcial">Parcial</MenuItem>
                      <MenuItem value="final">Final</MenuItem>
                      <MenuItem value="quiz">Quiz</MenuItem>
                      <MenuItem value="tarea">Tarea</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="descripcion"
                    label="Descripción de la Evaluación"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    error={!!formErrors.descripcion}
                    helperText={formErrors.descripcion}
                    disabled={dialogMode === 'view'}
                    fullWidth
                    multiline
                    rows={2}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="peso"
                    label="Peso de la Evaluación"
                    type="number"
                    value={formData.peso}
                    onChange={handleInputChange}
                    disabled={dialogMode === 'view'}
                    fullWidth
                    inputProps={{ min: 0.1, step: 0.1 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="fechaEvaluacion"
                    label="Fecha de Evaluación"
                    type="date"
                    value={formData.fechaEvaluacion}
                    onChange={handleInputChange}
                    disabled={dialogMode === 'view'}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    name="observaciones"
                    label="Observaciones (Opcional)"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    disabled={dialogMode === 'view'}
                    fullWidth
                    multiline
                    rows={3}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 0 }}>
            {dialogMode === 'view' ? 'Cerrar' : 'Cancelar'}
          </Button>
          {dialogMode !== 'view' && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isSubmitting}
              sx={{ borderRadius: 0 }}
            >
              {isSubmitting ? <CircularProgress size={24} /> : 
               (dialogMode === 'create' ? 'Crear' : 'Actualizar')
              }
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GradesPage;