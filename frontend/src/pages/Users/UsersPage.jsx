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
  Tooltip,
  Menu,
  MenuItem as MenuItemComponent
} from '@mui/material';
import {
  People,
  Add,
  Search,
  Edit,
  Delete,
  MoreVert,
  PersonAdd,
  Block,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import UserService from '../../services/userService';
import { toast } from 'react-toastify';

const UsersPage = ({ teacherMode = false }) => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    rol: 'estudiante',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Menu for actions
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUserId, setMenuUserId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [teacherMode, user]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (teacherMode && user?.cedula) {
        // Cargar solo estudiantes de los cursos del profesor
        response = await UserService.getTeacherStudents(user.cedula);
      } else {
        // Cargar todos los usuarios (solo admin)
        response = await UserService.getAllUsers();
      }
      
      if (response.success) {
        setUsers(response.data || []);
      } else {
        throw new Error(response.error || 'Error cargando usuarios');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message);
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cedula.includes(searchTerm)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.rol === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.activo : !user.activo
      );
    }

    setFilteredUsers(filtered);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (mode, user = null) => {
    setDialogMode(mode);
    setSelectedUser(user);
    
    if (mode === 'create') {
      setFormData({
        cedula: '',
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        rol: 'estudiante',
        password: ''
      });
    } else if (mode === 'edit' && user) {
      setFormData({
        cedula: user.cedula,
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        rol: user.rol || 'estudiante',
        password: '' // No mostrar password actual
      });
    }
    
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      cedula: '',
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      direccion: '',
      rol: 'estudiante',
      password: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Función para verificar duplicados en tiempo real
  const handleEmailBlur = () => {
    if (formData.email && dialogMode === 'create') {
      const emailExists = users.some(user => 
        user.email.toLowerCase() === formData.email.toLowerCase()
      );
      
      if (emailExists) {
        setFormErrors(prev => ({
          ...prev,
          email: 'Este email ya está registrado. Por favor, usa otro email.'
        }));
      }
    }
  };

  const handleCedulaBlur = () => {
    if (formData.cedula && dialogMode === 'create') {
      const cedulaExists = users.some(user => user.cedula === formData.cedula);
      
      if (cedulaExists) {
        setFormErrors(prev => ({
          ...prev,
          cedula: 'Esta cédula ya está registrada. Por favor, verifica el número.'
        }));
      }
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.cedula.trim()) {
      errors.cedula = 'La cédula es requerida';
    } else if (!/^\d{8,12}$/.test(formData.cedula.trim())) {
      errors.cedula = 'La cédula debe tener entre 8 y 12 dígitos';
    }
    
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.apellido.trim()) {
      errors.apellido = 'El apellido es requerido';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    
    if (!formData.telefono.trim()) {
      errors.telefono = 'El teléfono es requerido';
    } else if (!/^\d{10}$/.test(formData.telefono.trim().replace(/\D/g, ''))) {
      errors.telefono = 'El teléfono debe tener 10 dígitos';
    }
    
    if (dialogMode === 'create' && !formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
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
      
      if (dialogMode === 'create') {
        response = await UserService.createUser(formData);
      } else if (dialogMode === 'edit') {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // No actualizar password si está vacío
        }
        response = await UserService.updateUser(formData.cedula, updateData);
      }
      
      if (response.success) {
        toast.success(
          dialogMode === 'create' 
            ? 'Usuario creado exitosamente' 
            : 'Usuario actualizado exitosamente'
        );
        handleCloseDialog();
        loadUsers();
      } else {
        throw new Error(response.error || 'Error al guardar usuario');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      
      // Extraer mensaje de error específico del servidor
      let errorMessage = 'Error al guardar usuario';
      
      if (err.response && err.response.data && err.response.data.message) {
        // El servidor envía el mensaje específico
        errorMessage = err.response.data.message;
        
        // Agregar sugerencias específicas para cada tipo de conflicto
        if (errorMessage.includes('email')) {
          errorMessage += '. Por favor, usa un email diferente.';
        } else if (errorMessage.includes('cédula')) {
          errorMessage += '. Por favor, verifica la cédula ingresada.';
        }
      } else if (err.response && err.response.status === 409) {
        // Error 409 sin mensaje específico
        errorMessage = 'Ya existe un usuario con esa cédula o email. Por favor, verifica los datos e intenta con información diferente.';
      } else if (err.response && err.response.status === 400) {
        // Error 400 sin mensaje específico
        errorMessage = 'Datos inválidos. Por favor, verifica que todos los campos estén correctos y completos.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMenuOpen = (event, userId) => {
    setAnchorEl(event.currentTarget);
    setMenuUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUserId(null);
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await UserService.toggleUserStatus(userId);
      if (response.success) {
        toast.success(`Usuario ${currentStatus ? 'desactivado' : 'activado'} exitosamente`);
        loadUsers();
      } else {
        throw new Error(response.error || 'Error al cambiar estado del usuario');
      }
    } catch (err) {
      console.error('Error toggling user status:', err);
      toast.error(err.message || 'Error al cambiar estado del usuario');
    }
    handleMenuClose();
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        const response = await UserService.deleteUser(userId);
        if (response.success) {
          toast.success('Usuario eliminado exitosamente');
          loadUsers();
        } else {
          throw new Error(response.error || 'Error al eliminar usuario');
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        toast.error(err.message || 'Error al eliminar usuario');
      }
    }
    handleMenuClose();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'administrador':
        return 'error';
      case 'profesor':
        return 'warning';
      case 'estudiante':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (active) => {
    return active ? 'success' : 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando usuarios...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <People sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4">
            {teacherMode ? 'Mis Estudiantes' : 'Gestión de Usuarios'}
          </Typography>
        </Box>
        
        {isAdmin && !teacherMode && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog('create')}
            sx={{ borderRadius: 0 }}
          >
            Nuevo Usuario
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Teacher Info Card - Solo para profesores */}
      {teacherMode && users.length > 0 && users[0] && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 0, bgcolor: 'primary.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)'
            }}>
              <People sx={{ color: 'white' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Estudiantes en tus Cursos
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {users[0].teacherInfo ? (
                  <>
                    {users[0].teacherInfo.totalCourses} curso(s) asignado(s) • {users.length} estudiante(s) inscrito(s)
                  </>
                ) : (
                  `${users.length} estudiante(s) inscrito(s) en tus cursos`
                )}
              </Typography>
              {users[0].teacherInfo?.courseNames && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {users[0].teacherInfo.courseNames.map((courseName, index) => (
                    <Typography 
                      key={index}
                      variant="caption" 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      {courseName}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por nombre, email o cédula..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Rol</InputLabel>
            <Select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              label="Rol"
              sx={{ borderRadius: 0 }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="administrador">Administrador</MenuItem>
              <MenuItem value="profesor">Profesor</MenuItem>
              <MenuItem value="estudiante">Estudiante</MenuItem>
            </Select>
          </FormControl>
          
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
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper sx={{ borderRadius: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cédula</TableCell>
                <TableCell>Nombre Completo</TableCell>
                <TableCell>Email</TableCell>
                {!teacherMode && <TableCell>Rol</TableCell>}
                <TableCell>Estado</TableCell>
                {teacherMode && <TableCell>Cursos Inscritos</TableCell>}
                <TableCell>Fecha Registro</TableCell>
                {isAdmin && <TableCell align="center">Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((userItem) => (
                  <TableRow key={userItem.cedula} hover>
                    <TableCell>{userItem.cedula}</TableCell>
                    <TableCell>{`${userItem.nombre} ${userItem.apellido}`}</TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    {!teacherMode && (
                      <TableCell>
                        <Chip
                          label={userItem.rol?.toUpperCase()}
                          color={getRoleColor(userItem.rol)}
                          size="small"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={userItem.activo ? 'Activo' : 'Inactivo'}
                        color={getStatusColor(userItem.activo)}
                        size="small"
                      />
                    </TableCell>
                    {teacherMode && (
                      <TableCell>
                        {userItem.cursosInscritos && userItem.cursosInscritos.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {userItem.cursosInscritos.map((curso, index) => (
                              <Chip
                                key={index}
                                label={curso.nombre}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.75rem',
                                  height: '24px',
                                  '& .MuiChip-label': {
                                    padding: '0 6px'
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Sin cursos
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {userItem.fechaCreacion 
                        ? new Date(userItem.fechaCreacion._seconds * 1000).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, userItem.cedula)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell 
                    colSpan={teacherMode ? (isAdmin ? 7 : 6) : (isAdmin ? 7 : 6)} 
                    align="center" 
                    sx={{ py: 4 }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      {teacherMode ? 'No tienes estudiantes inscritos en tus cursos' : 'No se encontraron usuarios'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
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
            const userToEdit = users.find(u => u.cedula === menuUserId);
            handleOpenDialog('edit', userToEdit);
            handleMenuClose();
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Editar
        </MenuItemComponent>
        
        <MenuItemComponent
          onClick={() => {
            const userToToggle = users.find(u => u.cedula === menuUserId);
            handleToggleUserStatus(menuUserId, userToToggle?.activo);
          }}
        >
          {users.find(u => u.cedula === menuUserId)?.activo ? (
            <>
              <Block fontSize="small" sx={{ mr: 1 }} />
              Desactivar
            </>
          ) : (
            <>
              <CheckCircle fontSize="small" sx={{ mr: 1 }} />
              Activar
            </>
          )}
        </MenuItemComponent>
        
        <MenuItemComponent
          onClick={() => handleDeleteUser(menuUserId)}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Eliminar
        </MenuItemComponent>
      </Menu>

      {/* Create/Edit User Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              name="cedula"
              label="Cédula"
              value={formData.cedula}
              onChange={handleInputChange}
              onBlur={handleCedulaBlur}
              error={!!formErrors.cedula}
              helperText={formErrors.cedula}
              disabled={dialogMode === 'edit'}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                name="nombre"
                label="Nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                error={!!formErrors.nombre}
                helperText={formErrors.nombre}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
              
              <TextField
                name="apellido"
                label="Apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                error={!!formErrors.apellido}
                helperText={formErrors.apellido}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
            </Box>
            
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleEmailBlur}
              error={!!formErrors.email}
              helperText={formErrors.email}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                name="telefono"
                label="Teléfono"
                value={formData.telefono}
                onChange={handleInputChange}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
              
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                  label="Rol"
                  sx={{ borderRadius: 0 }}
                >
                  <MenuItem value="estudiante">Estudiante</MenuItem>
                  <MenuItem value="profesor">Profesor</MenuItem>
                  <MenuItem value="administrador">Administrador</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              name="direccion"
              label="Dirección"
              value={formData.direccion}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            
            <TextField
              name="password"
              label={dialogMode === 'create' ? 'Contraseña' : 'Nueva Contraseña (opcional)'}
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              error={!!formErrors.password}
              helperText={formErrors.password || (dialogMode === 'edit' ? 'Dejar vacío para mantener la contraseña actual' : '')}
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
            Cancelar
          </Button>
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
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;