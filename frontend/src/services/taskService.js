import apiClient from '../config/api';

class TaskService {
  // Obtener todas las tareas (admin)
  static async getAllTasks(params = {}) {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  }

  // Obtener estadísticas de tareas
  static async getTaskStats(params = {}) {
    const response = await apiClient.get('/tasks/stats', { params });
    return response.data;
  }

  // Obtener tareas de un profesor específico
  static async getTeacherTasks(params = {}) {
    const response = await apiClient.get('/tasks/teacher', { params });
    return response.data;
  }

  // Obtener tareas de un curso
  static async getCourseTasks(cursoId, params = {}) {
    const response = await apiClient.get(`/tasks/course/${cursoId}`, { params });
    return response.data;
  }

  // Obtener tareas para estudiantes
  static async getStudentTasks(cedula) {
    const response = await apiClient.get(`/tasks/student/${cedula}`);
    return response.data;
  }

  // Obtener una tarea específica con estudiantes del curso
  static async getTaskWithStudents(taskId) {
    const response = await apiClient.get(`/tasks/${taskId}/students`);
    return response.data;
  }

  // Crear nueva tarea (profesores y admin)
  static async createTask(taskData) {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  }

  // Actualizar tarea (profesor que la creó y admin)
  static async updateTask(taskId, updateData) {
    const response = await apiClient.put(`/tasks/${taskId}`, updateData);
    return response.data;
  }

  // Eliminar tarea (profesor que la creó y admin)
  static async deleteTask(taskId) {
    const response = await apiClient.delete(`/tasks/${taskId}`);
    return response.data;
  }
}

export default TaskService;