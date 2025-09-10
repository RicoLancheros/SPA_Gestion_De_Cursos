import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Assignment,
  School,
  Person,
  Schedule,
  Place,
  ExitToApp,
  Visibility,
  AccessTime,
  Warning,
  CheckCircle,
  Cancel,
  MoreVert,
  Info
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import EnrollmentService from '../../services/enrollmentService';
import { toast } from 'react-toastify';

const EnrollmentsPage = ({ studentMode = false }) => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(studentMode ? 9 : 10);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Withdraw dialog
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  
  // Details dialog
  const [detailsDialog, setDetailsDialog] = useState(false);
  
  // Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuEnrollmentId, setMenuEnrollmentId] = useState(null);

  useEffect(() => {
    loadEnrollments();
  }, [studentMode, statusFilter]);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (studentMode) {
        const params = statusFilter !== 'all' ? { estado: statusFilter } : {};
        response = await EnrollmentService.getMyEnrollments(params);
      } else {
        const params = statusFilter !== 'all' ? { estado: statusFilter } : {};
        response = await EnrollmentService.getAllEnrollments(params);
      }
      
      if (response.success) {
        setEnrollments(response.data || []);
      } else {
        throw new Error(response.error || 'Error cargando inscripciones');
      }
    } catch (err) {
      console.error('Error loading enrollments:', err);
      setError(err.message);
      toast.error('Error cargando inscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawClick = async (enrollment) => {
    try {
      // Verificar elegibilidad de retiro
      const eligibility = await EnrollmentService.checkWithdrawalEligibility(enrollment.id);
      
      if (!eligibility.canWithdraw) {
        toast.error('Ya no puedes retirarte de este curso (han pasado más de 24 horas)');
        return;
      }
      
      setSelectedEnrollment(enrollment);
      setWithdrawDialog(true);
    } catch (err) {
      console.error('Error checking withdrawal eligibility:', err);
      toast.error('Error verificando elegibilidad de retiro');
    }
  };

  const handleWithdrawConfirm = async () => {
    if (!selectedEnrollment) return;
    
    setWithdrawing(true);
    try {
      const response = await EnrollmentService.withdrawFromCourse(
        selectedEnrollment.id, 
        withdrawReason || 'Retiro voluntario'
      );
      
      if (response.success) {
        toast.success('Te has retirado exitosamente del curso');
        setWithdrawDialog(false);
        setWithdrawReason('');
        setSelectedEnrollment(null);
        loadEnrollments();
      } else {
        throw new Error(response.error || 'Error al retirarse del curso');
      }
    } catch (err) {
      console.error('Error withdrawing from course:', err);
      toast.error(err.message || 'Error al retirarse del curso');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDetailsClick = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setDetailsDialog(true);
  };

  const handleMenuOpen = (event, enrollmentId) => {
    setAnchorEl(event.currentTarget);
    setMenuEnrollmentId(enrollmentId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuEnrollmentId(null);
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'activo':
        return 'success';
      case 'retirado':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'activo':
        return <CheckCircle fontSize="small" />;
      case 'retirado':
        return <Cancel fontSize="small" />;
      default:
        return <Info fontSize="small" />;
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (statusFilter === 'all') return true;
    return enrollment.estado === statusFilter;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando inscripciones...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Assignment sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h4">
          {studentMode ? 'Mis Inscripciones' : 'Gestión de Matrículas'}
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      {!studentMode && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('all')}
              size="small"
            >
              Todas
            </Button>
            <Button
              variant={statusFilter === 'activo' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('activo')}
              size="small"
              color="success"
            >
              Activas
            </Button>
            <Button
              variant={statusFilter === 'retirado' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('retirado')}
              size="small"
              color="error"
            >
              Retiradas
            </Button>
          </Box>
        </Paper>
      )}

      {/* Content */}
      {studentMode ? (
        // Card view for students
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {filteredEnrollments
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((enrollment) => (
                <Grid item xs={12} md={6} lg={4} key={enrollment.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {enrollment.curso?.nombre || 'Curso sin nombre'}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(enrollment.estado)}
                          label={enrollment.estado === 'activo' ? 'INSCRITO' : 'RETIRADO'}
                          color={getStatusColor(enrollment.estado)}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {enrollment.curso?.descripcion || 'Sin descripción disponible'}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Person fontSize="small" />
                        <Typography variant="body2">
                          {enrollment.docente ? 
                            `${enrollment.docente.nombre} ${enrollment.docente.apellido}` : 
                            'Sin profesor asignado'
                          }
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Place fontSize="small" />
                        <Typography variant="body2">
                          {enrollment.curso?.salonOLink || 'No especificado'}
                        </Typography>
                      </Box>

                      {enrollment.curso?.horarios && enrollment.curso.horarios.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Schedule fontSize="small" />
                          <Typography variant="body2">
                            {enrollment.curso.horarios[0].dia} {enrollment.curso.horarios[0].horaInicio}-{enrollment.curso.horarios[0].horaFin}
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        Inscrito: {new Date(enrollment.fechaInscripcion).toLocaleDateString('es-ES')}
                      </Typography>

                      {enrollment.puedeRetirarse && enrollment.estado === 'activo' && (
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            icon={<AccessTime fontSize="small" />}
                            label="Puedes retirarte (24h)"
                            color="warning"
                            size="small"
                          />
                        </Box>
                      )}
                    </CardContent>

                    <CardActions>
                      <Button size="small" onClick={() => handleDetailsClick(enrollment)}>
                        Ver Detalles
                      </Button>
                      {enrollment.estado === 'activo' && enrollment.puedeRetirarse && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleWithdrawClick(enrollment)}
                          startIcon={<ExitToApp />}
                        >
                          Retirarse
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
          </Grid>

          {filteredEnrollments.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                {statusFilter === 'all' 
                  ? 'No tienes inscripciones registradas' 
                  : `No tienes inscripciones ${statusFilter === 'activo' ? 'activas' : 'retiradas'}`
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {statusFilter === 'all' && 'Ve a la sección de Cursos para inscribirte a un curso'}
              </Typography>
            </Paper>
          )}
        </>
      ) : (
        // Table view for admin
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Curso</TableCell>
                  <TableCell>Fecha Inscripción</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha Retiro</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEnrollments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((enrollment) => (
                    <TableRow key={enrollment.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {enrollment.estudiante ? 
                            `${enrollment.estudiante.nombre} ${enrollment.estudiante.apellido}` : 
                            'Estudiante desconocido'
                          }
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {enrollment.estudiante?.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {enrollment.curso?.nombre || 'Curso desconocido'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {enrollment.curso?.carrera}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(enrollment.fechaInscripcion).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(enrollment.estado)}
                          label={enrollment.estado.toUpperCase()}
                          color={getStatusColor(enrollment.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {enrollment.fechaRetiro ? 
                          new Date(enrollment.fechaRetiro).toLocaleDateString('es-ES') : 
                          '-'
                        }
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, enrollment.id)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                
                {filteredEnrollments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No se encontraron inscripciones
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
      <Paper sx={{ mt: 0 }}>
        <TablePagination
          rowsPerPageOptions={studentMode ? [9, 18, 27] : [5, 10, 25]}
          component="div"
          count={filteredEnrollments.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const enrollmentToView = enrollments.find(e => e.id === menuEnrollmentId);
            handleDetailsClick(enrollmentToView);
            handleMenuClose();
          }}
        >
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          Ver Detalles
        </MenuItem>
      </Menu>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog} onClose={() => setWithdrawDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning color="warning" />
            Retirar de Curso
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            ¿Estás seguro de que quieres retirarte del curso <strong>{selectedEnrollment?.curso?.nombre}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Esta acción no se puede deshacer después de las 24 horas desde la inscripción.
          </Typography>
          
          <TextField
            label="Motivo del retiro (opcional)"
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialog(false)} disabled={withdrawing}>
            Cancelar
          </Button>
          <Button
            onClick={handleWithdrawConfirm}
            color="error"
            variant="contained"
            disabled={withdrawing}
          >
            {withdrawing ? <CircularProgress size={20} /> : 'Confirmar Retiro'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School />
            Detalles de la Inscripción
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedEnrollment && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Información del Curso</Typography>
                  <Typography><strong>Nombre:</strong> {selectedEnrollment.curso?.nombre}</Typography>
                  <Typography><strong>Categoría:</strong> {selectedEnrollment.curso?.carrera}</Typography>
                  <Typography><strong>Modalidad:</strong> {selectedEnrollment.curso?.modalidad}</Typography>
                  <Typography><strong>Lugar/Link:</strong> {selectedEnrollment.curso?.salonOLink}</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Información de Inscripción</Typography>
                  <Typography><strong>Estado:</strong> 
                    <Chip
                      label={selectedEnrollment.estado.toUpperCase()}
                      color={getStatusColor(selectedEnrollment.estado)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography><strong>Fecha inscripción:</strong> {new Date(selectedEnrollment.fechaInscripcion).toLocaleDateString('es-ES')}</Typography>
                  {selectedEnrollment.fechaRetiro && (
                    <Typography><strong>Fecha retiro:</strong> {new Date(selectedEnrollment.fechaRetiro).toLocaleDateString('es-ES')}</Typography>
                  )}
                </Grid>

                {selectedEnrollment.curso?.horarios && selectedEnrollment.curso.horarios.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Horarios</Typography>
                    {selectedEnrollment.curso.horarios.map((horario, index) => (
                      <Typography key={index}>
                        <strong>{horario.dia}:</strong> {horario.horaInicio} - {horario.horaFin}
                      </Typography>
                    ))}
                  </Grid>
                )}

                {selectedEnrollment.docente && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Profesor</Typography>
                    <Typography><strong>Nombre:</strong> {selectedEnrollment.docente.nombre} {selectedEnrollment.docente.apellido}</Typography>
                    <Typography><strong>Email:</strong> {selectedEnrollment.docente.email}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnrollmentsPage;