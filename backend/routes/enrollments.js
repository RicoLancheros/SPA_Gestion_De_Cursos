import express from 'express';
import EnrollmentController from '../controllers/enrollmentController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.authenticate);

// Obtener todas las matrículas (solo admin)
router.get('/', AuthMiddleware.requireAdmin, EnrollmentController.getAllEnrollments);

// Estadísticas de matrículas (admin y profesores)
router.get('/stats', AuthMiddleware.requireAdminOrTeacher, EnrollmentController.getEnrollmentStats);

// Obtener mis matrículas (estudiantes)
router.get('/my-enrollments', AuthMiddleware.requireStudent, EnrollmentController.getMyEnrollments);

// Obtener estudiantes de un curso (profesores del curso y admin)
router.get('/course/:cursoId', AuthMiddleware.requireAdminOrTeacher, EnrollmentController.getCourseEnrollments);

// Verificar elegibilidad de retiro (estudiantes)
router.get('/:id/withdrawal-eligibility', AuthMiddleware.requireStudent, EnrollmentController.checkWithdrawalEligibility);

// Verificar conflictos de horarios (estudiantes)
router.get('/check-conflicts/:cursoId', AuthMiddleware.requireStudent, EnrollmentController.checkScheduleConflicts);

// Inscribirse a un curso (estudiantes)
router.post('/enroll', AuthMiddleware.requireStudent, EnrollmentController.enrollInCourse);

// Inscribir estudiante manualmente (solo admin)
router.post('/manual-enroll', AuthMiddleware.requireAdmin, EnrollmentController.enrollStudentManually);

// Retirarse de un curso (estudiantes - solo 24h)
router.patch('/:id/withdraw', AuthMiddleware.requireStudent, EnrollmentController.withdrawFromCourse);

// Retirar estudiante manualmente (admin y profesores del curso)
router.patch('/:id/manual-withdraw', AuthMiddleware.requireAdminOrTeacher, EnrollmentController.withdrawStudentManually);

// Reactivar matrícula (solo admin)
router.patch('/:id/reactivate', AuthMiddleware.requireAdmin, EnrollmentController.reactivateEnrollment);

export default router;