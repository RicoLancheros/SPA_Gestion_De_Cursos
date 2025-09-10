import express from 'express';
import UserController from '../controllers/userController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.authenticate);

// Obtener todos los usuarios (solo admin)
router.get('/', AuthMiddleware.requireAdmin, UserController.getAllUsers);

// Buscar usuarios (solo admin)
router.get('/search', AuthMiddleware.requireAdmin, UserController.searchUsers);

// Obtener profesores (admin y profesores)
router.get('/teachers', AuthMiddleware.requireAdminOrTeacher, UserController.getTeachers);

// Obtener estudiantes (admin y profesores)
router.get('/students', AuthMiddleware.requireAdminOrTeacher, UserController.getStudents);

// Obtener estudiantes de los cursos de un profesor específico (solo profesores)
router.get('/teacher/:cedula/students', AuthMiddleware.requireAdminOrTeacher, UserController.getTeacherStudents);

// Estadísticas de usuarios (solo admin)
router.get('/stats', AuthMiddleware.requireAdmin, UserController.getUserStats);

// Obtener usuario por cédula
router.get('/:cedula', UserController.getUserByCedula);

// Crear usuario (solo admin - para profesores y otros admins)
router.post('/', AuthMiddleware.requireAdmin, UserController.createUser);

// Actualizar usuario
router.put('/:cedula', UserController.updateUser);

// Activar usuario (solo admin)
router.patch('/:cedula/activate', AuthMiddleware.requireAdmin, UserController.activateUser);

// Desactivar usuario (solo admin)
router.delete('/:cedula', AuthMiddleware.requireAdmin, UserController.deactivateUser);

export default router;