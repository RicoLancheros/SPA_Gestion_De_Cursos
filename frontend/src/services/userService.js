import apiClient from '../config/api';

class UserService {
  // Obtener todos los usuarios (admin)
  static async getAllUsers(params = {}) {
    const response = await apiClient.get('/users', { params });
    return response.data;
  }

  // Buscar usuarios (admin)
  static async searchUsers(searchTerm, filters = {}) {
    const response = await apiClient.get('/users/search', { 
      params: { q: searchTerm, ...filters } 
    });
    return response.data;
  }

  // Obtener profesores
  static async getTeachers(params = {}) {
    const response = await apiClient.get('/users/teachers', { params });
    return response.data;
  }

  // Obtener estudiantes
  static async getStudents(params = {}) {
    const response = await apiClient.get('/users/students', { params });
    return response.data;
  }

  // Obtener estudiantes de los cursos de un profesor (solo para profesores)
  static async getTeacherStudents(teacherCedula) {
    const response = await apiClient.get(`/users/teacher/${teacherCedula}/students`);
    return response.data;
  }

  // Obtener estadísticas de usuarios (admin)
  static async getUserStats() {
    const response = await apiClient.get('/users/stats');
    return response.data;
  }

  // Obtener usuario por cédula
  static async getUserByCedula(cedula) {
    const response = await apiClient.get(`/users/${cedula}`);
    return response.data;
  }

  // Crear usuario (admin)
  static async createUser(userData) {
    const response = await apiClient.post('/users', userData);
    return response.data;
  }

  // Actualizar usuario
  static async updateUser(cedula, updateData) {
    const response = await apiClient.put(`/users/${cedula}`, updateData);
    return response.data;
  }

  // Activar usuario (admin)
  static async activateUser(cedula) {
    const response = await apiClient.patch(`/users/${cedula}/activate`);
    return response.data;
  }

  // Desactivar usuario (admin)
  static async deactivateUser(cedula) {
    const response = await apiClient.delete(`/users/${cedula}`);
    return response.data;
  }
}

export default UserService;