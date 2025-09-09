import apiClient from '../config/api';

class EnrollmentService {
  // Obtener todas las matrículas (admin)
  static async getAllEnrollments(params = {}) {
    const response = await apiClient.get('/enrollments', { params });
    return response.data;
  }

  // Obtener estadísticas de matrículas
  static async getEnrollmentStats(params = {}) {
    const response = await apiClient.get('/enrollments/stats', { params });
    return response.data;
  }

  // Obtener mis matrículas (estudiantes)
  static async getMyEnrollments(params = {}) {
    const response = await apiClient.get('/enrollments/my-enrollments', { params });
    return response.data;
  }

  // Obtener estudiantes de un curso
  static async getCourseEnrollments(cursoId, params = {}) {
    const response = await apiClient.get(`/enrollments/course/${cursoId}`, { params });
    return response.data;
  }

  // Verificar elegibilidad de retiro (estudiantes)
  static async checkWithdrawalEligibility(enrollmentId) {
    const response = await apiClient.get(`/enrollments/${enrollmentId}/withdrawal-eligibility`);
    return response.data;
  }

  // Verificar conflictos de horarios antes de inscribirse (estudiantes)
  static async checkScheduleConflicts(cursoId) {
    const response = await apiClient.get(`/enrollments/check-conflicts/${cursoId}`);
    return response.data;
  }

  // Inscribirse a un curso (estudiantes)
  static async enrollInCourse(cursoId) {
    const response = await apiClient.post('/enrollments/enroll', { cursoId });
    return response.data;
  }

  // Inscribir estudiante manualmente (admin)
  static async enrollStudentManually(enrollmentData) {
    const response = await apiClient.post('/enrollments/manual-enroll', enrollmentData);
    return response.data;
  }

  // Retirarse de un curso (estudiantes - solo 24h)
  static async withdrawFromCourse(enrollmentId, motivo = '') {
    const response = await apiClient.patch(`/enrollments/${enrollmentId}/withdraw`, { motivo });
    return response.data;
  }

  // Retirar estudiante manualmente (admin y profesores del curso)
  static async withdrawStudentManually(enrollmentId, motivo) {
    const response = await apiClient.patch(`/enrollments/${enrollmentId}/manual-withdraw`, { motivo });
    return response.data;
  }

  // Reactivar matrícula (admin)
  static async reactivateEnrollment(enrollmentId) {
    const response = await apiClient.patch(`/enrollments/${enrollmentId}/reactivate`);
    return response.data;
  }
}

export default EnrollmentService;