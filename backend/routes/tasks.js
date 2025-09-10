import express from 'express';
import TaskController from '../controllers/taskController.js';
import AuthMiddleware from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.authenticate);

// Obtener todas las tareas (solo admin)
router.get('/', AuthMiddleware.requireAdmin, TaskController.getAllTasks);

// Estadísticas de tareas
router.get('/stats', AuthMiddleware.requireAdminOrTeacher, TaskController.getTaskStats);

// Obtener tareas de un profesor específico
router.get('/teacher', AuthMiddleware.requireAdminOrTeacher, TaskController.getTeacherTasks);

// Obtener tareas de un curso (profesores del curso y admin)
router.get('/course/:cursoId', AuthMiddleware.requireAdminOrTeacher, TaskController.getCourseTasks);

// Obtener tareas para estudiantes
router.get('/student/:cedula', TaskController.getStudentTasks);

// Obtener una tarea específica con estudiantes del curso
router.get('/:taskId/students', AuthMiddleware.requireAdminOrTeacher, TaskController.getTaskWithStudents);

// Crear nueva tarea (profesores y admin)
router.post('/', AuthMiddleware.requireAdminOrTeacher, TaskController.createTask);

// Actualizar tarea (profesor que la creó y admin)
router.put('/:taskId', AuthMiddleware.requireAdminOrTeacher, TaskController.updateTask);

// Eliminar tarea (profesor que la creó y admin)
router.delete('/:taskId', AuthMiddleware.requireAdminOrTeacher, TaskController.deleteTask);

export default router;