import express from 'express';
import CourseController from '../controllers/courseController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas (solo para estudiantes ver cursos disponibles)
router.get('/available', AuthMiddleware.authenticate, AuthMiddleware.requireStudent, CourseController.getAvailableCourses);

// Todas las demás rutas requieren autenticación
router.use(AuthMiddleware.authenticate);

// Obtener todos los cursos (con filtros y paginación)
router.get('/', CourseController.getAllCourses);

// Buscar cursos
router.get('/search', CourseController.searchCourses);

// Estadísticas de cursos (admin y profesores)
router.get('/stats', AuthMiddleware.requireAdminOrTeacher, CourseController.getCourseStats);

// Obtener cursos de un profesor específico
router.get('/teacher/:cedula', CourseController.getTeacherCourses);

// Obtener curso por ID
router.get('/:id', CourseController.getCourseById);

// Crear nuevo curso (solo admin)
router.post('/', AuthMiddleware.requireAdmin, CourseController.createCourse);

// Actualizar curso (admin y profesor del curso)
router.put('/:id', CourseController.updateCourse);

// Asignar profesor a curso (solo admin)
router.patch('/:id/assign-teacher', AuthMiddleware.requireAdmin, CourseController.assignTeacher);

// Cambiar estado del curso (solo admin)
router.patch('/:id/toggle-status', AuthMiddleware.requireAdmin, CourseController.toggleCourseStatus);

// Eliminar curso (solo admin)
router.delete('/:id', AuthMiddleware.requireAdmin, CourseController.deleteCourse);

export default router;