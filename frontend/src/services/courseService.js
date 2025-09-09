import apiClient from '../config/api';

class CourseService {
  // Obtener cursos disponibles (estudiantes)
  static async getAvailableCourses(params = {}) {
    const response = await apiClient.get('/courses/available', { params });
    return response.data;
  }

  // Obtener todos los cursos (con filtros y paginación)
  static async getAllCourses(params = {}) {
    const response = await apiClient.get('/courses', { params });
    return response.data;
  }

  // Buscar cursos
  static async searchCourses(searchTerm, filters = {}) {
    const response = await apiClient.get('/courses/search', { 
      params: { q: searchTerm, ...filters } 
    });
    return response.data;
  }

  // Obtener estadísticas de cursos
  static async getCourseStats(params = {}) {
    const response = await apiClient.get('/courses/stats', { params });
    return response.data;
  }

  // Obtener cursos de un profesor específico
  static async getTeacherCourses(cedula, params = {}) {
    const response = await apiClient.get(`/courses/teacher/${cedula}`, { params });
    return response.data;
  }

  // Obtener curso por ID
  static async getCourseById(id) {
    const response = await apiClient.get(`/courses/${id}`);
    return response.data;
  }

  // Crear nuevo curso (admin)
  static async createCourse(courseData) {
    const response = await apiClient.post('/courses', courseData);
    return response.data;
  }

  // Actualizar curso
  static async updateCourse(id, updateData) {
    const response = await apiClient.put(`/courses/${id}`, updateData);
    return response.data;
  }

  // Asignar profesor a curso (admin)
  static async assignTeacher(id, teacherCedula) {
    const response = await apiClient.patch(`/courses/${id}/assign-teacher`, { 
      docenteAsignado: teacherCedula 
    });
    return response.data;
  }

  // Cambiar estado del curso (activar/desactivar)
  static async toggleCourseStatus(id) {
    const response = await apiClient.patch(`/courses/${id}/toggle-status`);
    return response.data;
  }

  // Eliminar curso (admin)
  static async deleteCourse(id) {
    const response = await apiClient.delete(`/courses/${id}`);
    return response.data;
  }
}

export default CourseService;