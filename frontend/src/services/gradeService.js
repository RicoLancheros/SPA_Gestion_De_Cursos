import apiClient from '../config/api';

class GradeService {
  // Obtener todas las calificaciones (admin)
  static async getAllGrades(params = {}) {
    const response = await apiClient.get('/grades', { params });
    return response.data;
  }

  // Obtener estadísticas de calificaciones
  static async getGradeStats(params = {}) {
    const response = await apiClient.get('/grades/stats', { params });
    return response.data;
  }

  // Obtener calificaciones de un estudiante
  static async getStudentGrades(cedula, params = {}) {
    const response = await apiClient.get(`/grades/student/${cedula}`, { params });
    return response.data;
  }

  // Obtener reporte completo de un estudiante (todas sus materias)
  static async getStudentReport(cedula) {
    const response = await apiClient.get(`/grades/student/${cedula}/report`);
    return response.data;
  }

  // Obtener calificaciones de un curso
  static async getCourseGrades(cursoId, params = {}) {
    const response = await apiClient.get(`/grades/course/${cursoId}`, { params });
    return response.data;
  }

  // Obtener promedio de un estudiante en un curso específico
  static async getStudentCourseAverage(cedula, cursoId) {
    const response = await apiClient.get(`/grades/student/${cedula}/course/${cursoId}/average`);
    return response.data;
  }

  // Crear calificación (profesores del curso y admin)
  static async createGrade(gradeData) {
    const response = await apiClient.post('/grades', gradeData);
    return response.data;
  }

  // Obtener calificaciones de una tarea específica
  static async getTaskGrades(taskId) {
    const response = await apiClient.get(`/grades/task/${taskId}`);
    return response.data;
  }

  // Actualizar calificación (profesor del curso y admin)
  static async updateGrade(id, updateData) {
    const response = await apiClient.put(`/grades/${id}`, updateData);
    return response.data;
  }

  // Eliminar calificación (admin)
  static async deleteGrade(id) {
    const response = await apiClient.delete(`/grades/${id}`);
    return response.data;
  }
}

export default GradeService;