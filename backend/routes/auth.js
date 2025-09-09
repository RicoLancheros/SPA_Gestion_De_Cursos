import express from 'express';
import AuthController from '../controllers/authController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (no requieren autenticación)

/**
 * @route POST /api/auth/register
 * @description Registrar nuevo estudiante
 * @access Public
 */
router.post('/register', AuthController.register);

/**
 * @route POST /api/auth/login
 * @description Iniciar sesión
 * @access Public
 */
router.post('/login', AuthController.login);

/**
 * @route POST /api/auth/refresh-token
 * @description Renovar token de acceso usando refresh token
 * @access Public
 */
router.post('/refresh-token', AuthController.refreshToken);

// Rutas protegidas (requieren autenticación)

/**
 * @route POST /api/auth/logout
 * @description Cerrar sesión (invalidar token)
 * @access Private
 */
router.post('/logout', 
  AuthMiddleware.authenticate,
  AuthController.logout
);

/**
 * @route GET /api/auth/profile
 * @description Obtener perfil del usuario actual
 * @access Private
 */
router.get('/profile', 
  AuthMiddleware.authenticate,
  AuthMiddleware.requireActiveUser,
  AuthController.getProfile
);

/**
 * @route PUT /api/auth/profile
 * @description Actualizar perfil del usuario actual
 * @access Private
 */
router.put('/profile', 
  AuthMiddleware.authenticate,
  AuthMiddleware.requireActiveUser,
  AuthController.updateProfile
);

/**
 * @route POST /api/auth/change-password
 * @description Cambiar contraseña del usuario actual
 * @access Private
 */
router.post('/change-password', 
  AuthMiddleware.authenticate,
  AuthMiddleware.requireActiveUser,
  AuthController.changePassword
);

/**
 * @route GET /api/auth/verify-token
 * @description Verificar si el token actual es válido
 * @access Private
 */
router.get('/verify-token', 
  AuthMiddleware.authenticate,
  AuthController.verifyToken
);

// Rutas de administrador

/**
 * @route GET /api/auth/stats
 * @description Obtener estadísticas de autenticación
 * @access Private (Admin only)
 */
router.get('/stats', 
  AuthMiddleware.authenticate,
  AuthMiddleware.requireAdmin,
  AuthController.getAuthStats
);

// Middleware de manejo de errores específico para rutas de auth
router.use((error, req, res, next) => {
  console.error('Error en rutas de autenticación:', error);
  
  // Errores de validación de JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'TokenExpired',
      message: 'Token expirado'
    });
  }

  // Error genérico
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Error interno del servidor'
  });
});

export default router;