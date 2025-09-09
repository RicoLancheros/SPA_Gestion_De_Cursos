import express from 'express';
import GradeController from '../controllers/gradeController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.authenticate);

// Obtener todas las calificaciones (solo admin)
router.get('/', AuthMiddleware.requireAdmin, GradeController.getAllGrades);

// Estadísticas de calificaciones (admin, profesores para sus cursos)
router.get('/stats', AuthMiddleware.requireAdminOrTeacher, GradeController.getGradeStats);

// Obtener calificaciones de un estudiante
router.get('/student/:cedula', GradeController.getStudentGrades);

// Obtener reporte completo de un estudiante (todas sus materias)
router.get('/student/:cedula/report', GradeController.getStudentReport);

// Obtener calificaciones de un curso (profesores del curso y admin)
router.get('/course/:cursoId', AuthMiddleware.requireAdminOrTeacher, GradeController.getCourseGrades);

// Obtener promedio de un estudiante en un curso específico
router.get('/student/:cedula/course/:cursoId/average', GradeController.getStudentCourseAverage);

// Crear calificación (profesores del curso y admin)
router.post('/', AuthMiddleware.requireAdminOrTeacher, GradeController.createGrade);

// Actualizar calificación (profesor del curso y admin)
router.put('/:id', AuthMiddleware.requireAdminOrTeacher, GradeController.updateGrade);

// Eliminar calificación (solo admin)
router.delete('/:id', AuthMiddleware.requireAdmin, GradeController.deleteGrade);

export default router;