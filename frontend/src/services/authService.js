import apiClient from '../config/api';

class AuthService {
  // Login
  static async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  }

  // Registro
  static async register(userData) {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  }

  // Obtener perfil
  static async getProfile() {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  }

  // Actualizar perfil
  static async updateProfile(profileData) {
    const response = await apiClient.put('/auth/profile', profileData);
    return response.data;
  }

  // Cambiar contraseña
  static async changePassword(passwordData) {
    const response = await apiClient.post('/auth/change-password', passwordData);
    return response.data;
  }

  // Verificar token
  static async verifyToken() {
    const response = await apiClient.get('/auth/verify-token');
    return response.data;
  }

  // Renovar token
  static async refreshToken(refreshToken) {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    return response.data;
  }

  // Logout
  static async logout() {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }

  // Estadísticas de autenticación (solo admin)
  static async getAuthStats() {
    const response = await apiClient.get('/auth/stats');
    return response.data;
  }
}

export default AuthService;