import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Menu,
  MenuItem as MenuItemComponent,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  School,
  Add,
  Search,
  Edit,
  Delete,
  MoreVert,
  Person,
  Schedule,
  Group,
  CheckCircle,
  Block,
  Assignment,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import CourseService from '../../services/courseService';
import UserService from '../../services/userService';
import EnrollmentService from '../../services/enrollmentService';
import { toast } from 'react-toastify';

const CoursesPage = ({ teacherMode = false, studentMode = false }) => {
  const { user, isAdmin, isTeacher, isStudent } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(studentMode ? 12 : 10);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit' | 'view'
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    docenteCedula: '',
    capacidadMaxima: '',
    fechaInicio: '',
    fechaFin: '',
    modalidad: 'presencial',
    estado: 'inscripciones',
    salonOLink: '',
    objetivos: '',
    horarios: [{ dia: '', horaInicio: '', horaFin: '' }] // Array de horarios múltiples
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Menu for actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCourseId, setMenuCourseId] = useState(null);

  const categories = [
    'Programación y Desarrollo',
    'Diseño y Multimedia',
    'Administración y Negocios',
    'Salud y Bienestar',
    'Ingeniería y Tecnología',
    'Arte y Cultura',
    'Idiomas',
    'Otros'
  ];

  const diasSemana = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ];

  // Funciones para manejar horarios múltiples
  const handleHorarioChange = (index, field, value) => {
    const nuevosHorarios = [...formData.horarios];
    nuevosHorarios[index] = { ...nuevosHorarios[index], [field]: value };
    setFormData({ ...formData, horarios: nuevosHorarios });
  };

  const agregarHorario = () => {
    setFormData({
      ...formData,
      horarios: [...formData.horarios, { dia: '', horaInicio: '', horaFin: '' }]
    });
  };

  const eliminarHorario = (index) => {
    if (formData.horarios.length > 1) {
      const nuevosHorarios = formData.horarios.filter((_, i) => i !== index);
      setFormData({ ...formData, horarios: nuevosHorarios });
    }
  };


  useEffect(() => {
    loadData();
  }, [teacherMode, studentMode, user]);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let coursesResponse;
      if (teacherMode && user?.cedula) {
        coursesResponse = await CourseService.getTeacherCourses(user.cedula);
      } else if (studentMode) {
        coursesResponse = await CourseService.getAvailableCourses();
      } else {
        coursesResponse = await CourseService.getAllCourses();
      }
      
      if (coursesResponse.success) {
        setCourses(coursesResponse.data || []);
      } else {
        throw new Error(coursesResponse.error || 'Error cargando cursos');
      }

      // Cargar profesores solo si es admin
      if (isAdmin && !teacherMode && !studentMode) {
        const teachersResponse = await UserService.getTeachers();
        if (teachersResponse.success) {
          setTeachers(teachersResponse.data || []);
        }
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
      toast.error('Error cargando información');
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.carrera?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.docente && `${course.docente.nombre} ${course.docente.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (course.horarios && course.horarios.some(h => 
          (h.horaInicio && h.horaInicio.includes(searchTerm)) ||
          (h.horaFin && h.horaFin.includes(searchTerm))
        ))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => 
        statusFilter === 'active' ? course.estado === 'inscripciones' : course.estado !== 'inscripciones'
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.carrera === categoryFilter);
    }

    setFilteredCourses(filtered);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleCategoryFilterChange = (event) => {
    setCategoryFilter(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (mode, course = null) => {
    setDialogMode(mode);
    setSelectedCourse(course);
    
    if (mode === 'create') {
      setFormData({
        nombre: '',
        descripcion: '',
        categoria: categories[0],
        docenteCedula: '',
        capacidadMaxima: '',
        fechaInicio: '',
        fechaFin: '',
        modalidad: 'presencial',
        estado: 'inscripciones',
        salonOLink: '',
        objetivos: '',
        horarios: [{ dia: '', horaInicio: '', horaFin: '' }]
      });
    } else if ((mode === 'edit' || mode === 'view') && course) {
      // Extraer horarios múltiples si existen
      const horariosExistentes = course.horarios && Array.isArray(course.horarios) && course.horarios.length > 0 
        ? course.horarios 
        : [{ dia: '', horaInicio: '', horaFin: '' }];
      
      setFormData({
        nombre: course.nombre || '',
        descripcion: course.descripcion || '',
        categoria: course.carrera || categories[0],
        docenteCedula: course.docenteAsignado || '',
        capacidadMaxima: course.capacidadMaxima || '',
        fechaInicio: course.fechaInicio ? (course.fechaInicio._seconds ? new Date(course.fechaInicio._seconds * 1000).toISOString().split('T')[0] : course.fechaInicio.split('T')[0]) : '',
        fechaFin: course.fechaFin ? (course.fechaFin._seconds ? new Date(course.fechaFin._seconds * 1000).toISOString().split('T')[0] : course.fechaFin.split('T')[0]) : '',
        modalidad: course.modalidad || 'presencial',
        estado: course.estado || 'inscripciones',
        salonOLink: course.salonOLink || '',
        objetivos: course.objetivos || '',
        horarios: horariosExistentes
      });
    }
    
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCourse(null);
    setFormData({
      nombre: '',
      descripcion: '',
      categoria: categories[0],
      docenteCedula: '',
      capacidadMaxima: '',
      fechaInicio: '',
      fechaFin: '',
      modalidad: 'presencial',
      estado: 'inscripciones',
      salonOLink: '',
      horarios: [{ dia: '', horaInicio: '', horaFin: '' }],
      objetivos: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    
    if (!formData.capacidadMaxima || formData.capacidadMaxima <= 0) {
      errors.capacidadMaxima = 'La capacidad máxima debe ser mayor a 0';
    }
    
    if (!formData.salonOLink.trim()) {
      errors.salonOLink = formData.modalidad === 'presencial' ? 'El salón es requerido' : 'El link virtual es requerido';
    }
    
    if (!formData.fechaInicio) {
      errors.fechaInicio = 'La fecha de inicio es requerida';
    }
    
    if (!formData.fechaFin) {
      errors.fechaFin = 'La fecha de fin es requerida';
    }
    
    if (formData.fechaInicio && formData.fechaFin && formData.fechaInicio >= formData.fechaFin) {
      errors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let response;
      // Filtrar horarios que tengan datos completos
      const horarios = formData.horarios.filter(horario => 
        horario.dia && horario.horaInicio && horario.horaFin
      );

      const courseData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        carrera: formData.categoria,
        modalidad: formData.modalidad,
        estado: formData.estado,
        capacidadMaxima: parseInt(formData.capacidadMaxima),
        docenteAsignado: formData.docenteCedula,
        salonOLink: formData.salonOLink,
        duracionClase: 120,
        duracionTotal: 40, // Valor por defecto, se puede calcular automáticamente basado en horarios
        horarios: horarios,
        fechaInicio: formData.fechaInicio ? new Date(formData.fechaInicio) : null,
        fechaFin: formData.fechaFin ? new Date(formData.fechaFin) : null,
        objetivos: formData.objetivos
      };
      
      if (dialogMode === 'create') {
        response = await CourseService.createCourse(courseData);
      } else if (dialogMode === 'edit') {
        response = await CourseService.updateCourse(selectedCourse.id, courseData);
      }
      
      if (response.success) {
        toast.success(
          dialogMode === 'create' 
            ? 'Curso creado exitosamente' 
            : 'Curso actualizado exitosamente'
        );
        handleCloseDialog();
        loadData();
      } else {
        throw new Error(response.error || 'Error al guardar curso');
      }
    } catch (err) {
      console.error('Error saving course:', err);
      toast.error(err.message || 'Error al guardar curso');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMenuOpen = (event, courseId) => {
    setAnchorEl(event.currentTarget);
    setMenuCourseId(courseId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCourseId(null);
  };

  const handleToggleCourseStatus = async (courseId, currentStatus) => {
    try {
      const response = await CourseService.toggleCourseStatus(courseId);
      if (response.success) {
        toast.success(`Curso ${currentStatus ? 'desactivado' : 'activado'} exitosamente`);
        loadData();
      } else {
        throw new Error(response.error || 'Error al cambiar estado del curso');
      }
    } catch (err) {
      console.error('Error toggling course status:', err);
      toast.error(err.message || 'Error al cambiar estado del curso');
    }
    handleMenuClose();
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.')) {
      try {
        const response = await CourseService.deleteCourse(courseId);
        if (response.success) {
          toast.success('Curso eliminado exitosamente');
          loadData();
        } else {
          throw new Error(response.error || 'Error al eliminar curso');
        }
      } catch (err) {
        console.error('Error deleting course:', err);
        toast.error(err.message || 'Error al eliminar curso');
      }
    }
    handleMenuClose();
  };

  const handleEnrollInCourse = async (courseId) => {
    try {
      // Primero verificar conflictos de horarios
      const conflictCheck = await EnrollmentService.checkScheduleConflicts(courseId);
      
      if (conflictCheck.hasConflicts) {
        const conflictDetails = conflictCheck.conflicts
          .map(conflict => `${conflict.cursoNombre} (${conflict.dia} ${conflict.horaInicio}-${conflict.horaFin})`)
          .join('\n• ');
        
        const confirmed = window.confirm(
          `⚠️ CONFLICTO DE HORARIOS DETECTADO\n\n` +
          `Este curso tiene horarios que coinciden con:\n• ${conflictDetails}\n\n` +
          `¿Estás seguro de que deseas continuar con la inscripción?`
        );
        
        if (!confirmed) {
          return; // Usuario canceló la inscripción
        }
      }

      // Proceder con la inscripción
      const response = await EnrollmentService.enrollInCourse(courseId);
      
      if (response.success) {
        toast.success('Te has inscrito exitosamente al curso');
        loadData(); // Recargar para actualizar disponibilidad
      } else {
        throw new Error(response.error || 'Error al inscribirse al curso');
      }
    } catch (err) {
      console.error('Error enrolling in course:', err);
      
      // Mostrar mensaje específico para conflictos de horarios
      if (err.message && err.message.includes('Conflicto de horarios')) {
        toast.error(`❌ ${err.message}`);
      } else {
        toast.error(err.message || 'Error al inscribirse al curso');
      }
    }
  };

  const getStatusColor = (active) => {
    return active ? 'success' : 'default';
  };

  const getModalityColor = (modality) => {
    switch (modality) {
      case 'presencial':
        return 'primary';
      case 'virtual':
        return 'info';
      case 'mixta':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTitle = () => {
    if (teacherMode) return 'Mis Cursos';
    if (studentMode) return 'Cursos Disponibles';
    return 'Gestión de Cursos';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando cursos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <School sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4">
            {getTitle()}
          </Typography>
        </Box>
        
        {isAdmin && !teacherMode && !studentMode && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('create')}
            sx={{ borderRadius: 0 }}
          >
            Nuevo Curso
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por nombre, código, categoría o profesor..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 350, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              label="Categoría"
              sx={{ borderRadius: 0 }}
            >
              <MenuItem value="all">Todas</MenuItem>
              {categories.map(category => (
                <MenuItem key={category} value={category}>{category}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {!studentMode && (
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Estado"
                sx={{ borderRadius: 0 }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Activos</MenuItem>
                <MenuItem value="inactive">Inactivos</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </Paper>

      {/* Content based on mode */}
      {studentMode ? (
        // Card view for students
        <>
          <Grid container spacing={3} sx={{ width: '100%', overflow: 'hidden', mb: 4 }}>
            {filteredCourses
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course.id} sx={{ maxWidth: { xs: '100%', sm: '50%', md: '33.333%' }, minWidth: 0 }}>
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderRadius: 0,
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}>
                    <CardContent sx={{ 
                      flexGrow: 1,
                      width: '100%',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="h6" gutterBottom>
                        {course.nombre}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontFamily: 'monospace' }}>
                        ID: {course.id.substring(0, 6).toUpperCase()}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 2,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          hyphens: 'auto',
                          lineHeight: 1.4,
                          maxHeight: '4.2em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        {course.objetivos || course.descripcion || 'Sin descripción disponible'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          label={course.categoria} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                        <Chip 
                          label={course.modalidad?.toUpperCase()} 
                          size="small" 
                          color={getModalityColor(course.modalidad)}
                        />
                      </Box>
                      
                      {/* Días de clases */}
                      {course.horarios && course.horarios.length > 0 && course.horarios.some(h => h.dia) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Días de clases:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {course.horarios
                              .filter(horario => horario.dia)
                              .map((horario, index) => (
                                <Chip
                                  key={index}
                                  label={horario.dia}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: '20px',
                                    backgroundColor: (theme) => theme.palette.mode === 'dark' 
                                      ? 'rgba(144, 202, 249, 0.15)' 
                                      : '#f0f8ff',
                                    borderColor: (theme) => theme.palette.mode === 'dark'
                                      ? 'rgba(144, 202, 249, 0.6)'
                                      : '#90caf9',
                                    color: (theme) => theme.palette.mode === 'dark'
                                      ? '#90caf9'
                                      : 'inherit'
                                  }}
                                />
                              ))
                            }
                          </Box>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Person fontSize="small" />
                        <Typography variant="body2">
                          {course.docenteNombre || 'Sin profesor asignado'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Group fontSize="small" />
                        <Typography variant="body2">
                          Capacidad: {course.inscritosActuales || 0}/{course.capacidadMaxima}
                        </Typography>
                      </Box>
                      
                      {course.duracionHoras && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Schedule fontSize="small" />
                          <Typography variant="body2">
                            {course.duracionHoras} horas
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ pt: 0 }}>
                      <Button
                        size="small"
                        onClick={() => handleOpenDialog('view', course)}
                        sx={{ borderRadius: 0 }}
                      >
                        Ver Detalles
                      </Button>
                      
                      {course.activo && (course.inscritosActuales || 0) < course.capacidadMaxima && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleEnrollInCourse(course.id)}
                          sx={{ borderRadius: 0 }}
                        >
                          Inscribirse
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
          </Grid>
          
          {filteredCourses.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 0 }}>
              <Typography variant="h6" color="text.secondary">
                No se encontraron cursos disponibles
              </Typography>
            </Paper>
          )}
        </>
      ) : (
        // Table view for admin and teachers
        <Paper sx={{ borderRadius: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Días</TableCell>
                  <TableCell>Fecha Inicio y Fin</TableCell>
                  <TableCell>Horarios</TableCell>
                  <TableCell>Profesor</TableCell>
                  <TableCell>Modalidad</TableCell>
                  <TableCell>Inscritos</TableCell>
                  <TableCell>Estado</TableCell>
                  {(isAdmin || isTeacher) && <TableCell align="center">Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCourses
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((course) => (
                    <TableRow key={course.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                          {course.id.substring(0, 6).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {course.nombre?.length > 20 ? `${course.nombre.substring(0, 20)}...` : course.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {course.duracionTotal} horas
                        </Typography>
                      </TableCell>
                      
                      {/* Columna de Días */}
                      <TableCell>
                        {course.horarios && course.horarios.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {course.horarios
                              .filter(horario => horario.dia) // Solo horarios con día definido
                              .map((horario, index) => (
                                <Chip
                                  key={index}
                                  label={horario.dia}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: '20px',
                                    backgroundColor: (theme) => theme.palette.mode === 'dark' 
                                      ? 'rgba(144, 202, 249, 0.2)' 
                                      : '#f5f5f5',
                                    borderColor: (theme) => theme.palette.mode === 'dark'
                                      ? 'rgba(144, 202, 249, 0.5)'
                                      : '#e0e0e0',
                                    color: (theme) => theme.palette.mode === 'dark'
                                      ? '#90caf9'
                                      : 'inherit'
                                  }}
                                />
                              ))
                            }
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No definidos
                          </Typography>
                        )}
                      </TableCell>
                      
                      {/* Columna de Fechas */}
                      <TableCell>
                        <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                          <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>Inicio:</span>
                          <span style={{ marginLeft: '4px' }}>
                            {course.fechaInicio ? 
                              new Date(course.fechaInicio).toLocaleDateString('es-ES', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: '2-digit' 
                              })
                              : 'Sin fecha'
                            }
                          </span>
                        </Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                          <span style={{ fontWeight: 'bold', color: '#d32f2f' }}>Fin:</span>
                          <span style={{ marginLeft: '4px' }}>
                            {course.fechaFin ? 
                              new Date(course.fechaFin).toLocaleDateString('es-ES', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: '2-digit' 
                              })
                              : 'Sin fecha'
                            }
                          </span>
                        </Typography>
                      </TableCell>
                      
                      {/* Columna de Horarios */}
                      <TableCell>
                        <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                          {course.horarios && course.horarios.length > 0 && course.horarios[0].horaInicio && course.horarios[0].horaFin ? (
                            <>
                              <span style={{ fontWeight: 'bold', color: '#1976d2' }}>Ingreso:</span>
                              <span style={{ marginLeft: '4px', fontFamily: 'monospace' }}>{course.horarios[0].horaInicio}</span>
                              <br />
                              <span style={{ fontWeight: 'bold', color: '#1976d2' }}>Salida:</span>
                              <span style={{ marginLeft: '4px', fontFamily: 'monospace' }}>{course.horarios[0].horaFin}</span>
                            </>
                          ) : (
                            <span style={{ color: '#666', fontStyle: 'italic' }}>Sin horario definido</span>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {course.docente ? `${course.docente.nombre} ${course.docente.apellido}` : 'Sin asignar'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={course.modalidad?.toUpperCase()}
                          size="small"
                          color={getModalityColor(course.modalidad)}
                        />
                      </TableCell>
                      <TableCell>
                        {course.estudiantesInscritos || 0}/{course.capacidadMaxima}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={course.estado === 'inscripciones' ? 'Activo' : course.estado}
                          color={course.estado === 'inscripciones' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      {(isAdmin || isTeacher) && (
                        <TableCell align="center">
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, course.id)}
                            size="small"
                          >
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                
                {filteredCourses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No se encontraron cursos
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pagination */}
      <Paper sx={{ mt: 0, borderRadius: 0, borderTop: 0 }}>
        <TablePagination
          rowsPerPageOptions={studentMode ? [12, 24, 36] : [5, 10, 25]}
          component="div"
          count={filteredCourses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent
          onClick={() => {
            const courseToView = courses.find(c => c.id === menuCourseId);
            handleOpenDialog('view', courseToView);
            handleMenuClose();
          }}
        >
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItemComponent>
        
        {isAdmin && [
          <MenuItemComponent
            key="edit"
            onClick={() => {
              const courseToEdit = courses.find(c => c.id === menuCourseId);
              handleOpenDialog('edit', courseToEdit);
              handleMenuClose();
            }}
          >
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Editar
          </MenuItemComponent>,
          
          <MenuItemComponent
            key="toggle-status"
            onClick={() => {
              const courseToToggle = courses.find(c => c.id === menuCourseId);
              handleToggleCourseStatus(menuCourseId, courseToToggle?.estado === 'inscripciones');
            }}
          >
            {courses.find(c => c.id === menuCourseId)?.estado === 'inscripciones' ? (
              <><Block fontSize="small" sx={{ mr: 1 }} />Desactivar</>
            ) : (
              <><CheckCircle fontSize="small" sx={{ mr: 1 }} />Activar</>
            )}
          </MenuItemComponent>,
          
          <MenuItemComponent
            key="delete"
            onClick={() => handleDeleteCourse(menuCourseId)}
            sx={{ color: 'error.main' }}
          >
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Eliminar
          </MenuItemComponent>
        ]}
      </Menu>

      {/* Create/Edit/View Course Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Crear Nuevo Curso'}
          {dialogMode === 'edit' && 'Editar Curso'}
          {dialogMode === 'view' && 'Detalles del Curso'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* Fila 1: Nombre del Curso */}
            <TextField
              name="nombre"
              label="Nombre del Curso"
              value={formData.nombre}
              onChange={handleInputChange}
              error={!!formErrors.nombre}
              helperText={formErrors.nombre}
              disabled={dialogMode === 'view'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            
            {/* Fila 2: Categoría y Profesor */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ flex: 1 }} error={!!formErrors.categoria}>
                <InputLabel>Categoría</InputLabel>
                <Select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  label="Categoría"
                  disabled={dialogMode === 'view'}
                  sx={{ borderRadius: 0 }}
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Profesor Asignado</InputLabel>
                <Select
                  name="docenteCedula"
                  value={formData.docenteCedula}
                  onChange={handleInputChange}
                  label="Profesor Asignado"
                  disabled={dialogMode === 'view'}
                  sx={{ borderRadius: 0 }}
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {teachers.map(teacher => (
                    <MenuItem key={teacher.cedula} value={teacher.cedula}>
                      {teacher.nombre} {teacher.apellido}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {/* Fila 3: Modalidad, Estado y Capacidad */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Modalidad</InputLabel>
                <Select
                  name="modalidad"
                  value={formData.modalidad}
                  onChange={handleInputChange}
                  label="Modalidad"
                  disabled={dialogMode === 'view'}
                  sx={{ borderRadius: 0 }}
                >
                  <MenuItem value="presencial">Presencial</MenuItem>
                  <MenuItem value="virtual">Virtual</MenuItem>
                  <MenuItem value="mixta">Mixta</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ flex: 1 }}>
                <InputLabel>Estado del Curso</InputLabel>
                <Select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  label="Estado del Curso"
                  disabled={dialogMode === 'view'}
                  sx={{ borderRadius: 0 }}
                >
                  <MenuItem value="inscripciones">Activo</MenuItem>
                  <MenuItem value="iniciado">Iniciado</MenuItem>
                  <MenuItem value="finalizado">Finalizado</MenuItem>
                  <MenuItem value="cancelado">Inactivo</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                name="capacidadMaxima"
                label="Capacidad Máxima"
                type="number"
                value={formData.capacidadMaxima}
                onChange={handleInputChange}
                error={!!formErrors.capacidadMaxima}
                helperText={formErrors.capacidadMaxima}
                disabled={dialogMode === 'view'}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
            </Box>
            
            {/* Fila 4: Horarios Múltiples y Duración */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Horarios de Clase
                </Typography>
                {dialogMode !== 'view' && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={agregarHorario}
                    sx={{ borderRadius: 0 }}
                  >
                    + Agregar Horario
                  </Button>
                )}
              </Box>
              
              {formData.horarios.map((horario, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Día de la Semana</InputLabel>
                    <Select
                      value={horario.dia}
                      onChange={(e) => handleHorarioChange(index, 'dia', e.target.value)}
                      label="Día de la Semana"
                      disabled={dialogMode === 'view'}
                      sx={{ borderRadius: 0 }}
                    >
                      {diasSemana.map(dia => (
                        <MenuItem key={dia} value={dia}>{dia}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Hora Inicio"
                    type="time"
                    value={horario.horaInicio}
                    onChange={(e) => handleHorarioChange(index, 'horaInicio', e.target.value)}
                    disabled={dialogMode === 'view'}
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                  
                  <TextField
                    label="Hora Fin"
                    type="time"
                    value={horario.horaFin}
                    onChange={(e) => handleHorarioChange(index, 'horaFin', e.target.value)}
                    disabled={dialogMode === 'view'}
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                  
                  {dialogMode !== 'view' && formData.horarios.length > 1 && (
                    <IconButton
                      onClick={() => eliminarHorario(index)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              ))}
              
              <TextField
                name="salonOLink"
                label={formData.modalidad === 'presencial' ? 'Salón/Aula' : 'Link Virtual'}
                value={formData.salonOLink}
                onChange={handleInputChange}
                disabled={dialogMode === 'view'}
                error={!!formErrors.salonOLink}
                helperText={formErrors.salonOLink}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
            </Box>
            
            {/* Fila 5: Fechas */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                name="fechaInicio"
                label="Fecha de Inicio"
                type="date"
                value={formData.fechaInicio}
                onChange={handleInputChange}
                error={!!formErrors.fechaInicio}
                helperText={formErrors.fechaInicio}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
              
              <TextField
                name="fechaFin"
                label="Fecha de Fin"
                type="date"
                value={formData.fechaFin}
                onChange={handleInputChange}
                error={!!formErrors.fechaFin}
                helperText={formErrors.fechaFin}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
            </Box>
            
            {/* Descripción del curso */}
            <TextField
              name="objetivos"
              label="Descripción del curso"
              value={formData.objetivos}
              onChange={handleInputChange}
              disabled={dialogMode === 'view'}
              multiline
              rows={4}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={handleCloseDialog}
            sx={{ borderRadius: 0 }}
          >
            {dialogMode === 'view' ? 'Cerrar' : 'Cancelar'}
          </Button>
          {dialogMode !== 'view' && (
            <Button 
              onClick={handleSubmit}
              variant="contained"
              disabled={isSubmitting}
              sx={{ borderRadius: 0 }}
            >
              {isSubmitting ? (
                <CircularProgress size={20} />
              ) : (
                dialogMode === 'create' ? 'Crear' : 'Guardar'
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CoursesPage;