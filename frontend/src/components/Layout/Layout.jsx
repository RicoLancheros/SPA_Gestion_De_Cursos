import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  School,
  Assignment,
  Grade,
  AccountCircle,
  Logout,
  Settings,
  ChevronLeft,
  Home,
  DarkMode,
  LightMode
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useTheme as useCustomTheme } from '../../context/ThemeContext';

const drawerWidth = 280;

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout, isAdmin, isTeacher, isStudent } = useAuth();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // Manejar toggle del drawer móvil
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Manejar menú de usuario
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  // Manejar logout
  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/login');
  };

  // Navegación
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Elementos de navegación según el rol
  const getNavigationItems = () => {
    const commonItems = [
      { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' }
    ];

    if (isAdmin) {
      return [
        ...commonItems,
        { text: 'Usuarios', icon: <People />, path: '/users' },
        { text: 'Cursos', icon: <School />, path: '/courses' },
        { text: 'Matrículas', icon: <Assignment />, path: '/enrollments' },
        { text: 'Calificaciones', icon: <Grade />, path: '/grades' }
      ];
    } else if (isTeacher) {
      return [
        ...commonItems,
        { text: 'Mis Cursos', icon: <School />, path: '/my-courses' },
        { text: 'Estudiantes', icon: <People />, path: '/my-students' },
        { text: 'Calificaciones', icon: <Grade />, path: '/my-grades' }
      ];
    } else if (isStudent) {
      return [
        ...commonItems,
        { text: 'Cursos Disponibles', icon: <School />, path: '/available-courses' },
        { text: 'Mis Inscripciones', icon: <Assignment />, path: '/my-enrollments' },
        { text: 'Mis Calificaciones', icon: <Grade />, path: '/my-grades' }
      ];
    }

    return commonItems;
  };

  // Obtener color del rol
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

  // Contenido del drawer
  const drawer = (
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Home sx={{ color: 'primary.main', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            SPA Cursos
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeft />
          </IconButton>
        )}
      </Toolbar>

      <Divider />

      {/* Información del usuario */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            {user?.nombre?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {user?.nombre} {user?.apellido}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Lista de navegación */}
      <List>
        {getNavigationItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                minHeight: 48,
                px: 2.5
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      backgroundColor: 'background.default',
      minHeight: '100vh'
    }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderRadius: 0
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Sistema de Gestión de Cursos
          </Typography>

          {/* Botón de toggle tema */}
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ mr: 1 }}
            title={isDarkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {isDarkMode ? <LightMode /> : <DarkMode />}
          </IconButton>

          {/* Menú de usuario */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="user-menu"
            aria-haspopup="true"
            onClick={handleUserMenuOpen}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>

          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
          >
            <MenuItem onClick={() => { handleUserMenuClose(); navigate('/profile'); }}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Mi Perfil
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRadius: 0
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRadius: 0
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;