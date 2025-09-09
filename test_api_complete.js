import axios from 'axios';
import fs from 'fs';

const API_BASE = 'http://localhost:5000/api';

class APITester {
  constructor() {
    this.tokens = {};
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    this.results.push({ timestamp, type, message });
  }

  async makeRequest(method, endpoint, data = null, token = null) {
    try {
      const config = {
        method,
        url: `${API_BASE}${endpoint}`,
        headers: {}
      };

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (data) {
        config.headers['Content-Type'] = 'application/json';
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: error.message },
        status: error.response?.status || 500
      };
    }
  }

  async testHealthCheck() {
    this.log('🔍 Probando Health Check...');
    const result = await this.makeRequest('GET', '/health');
    
    if (result.success) {
      this.log('✅ Health check exitoso', 'success');
      return true;
    } else {
      this.log('❌ Health check falló: ' + result.error.message, 'error');
      return false;
    }
  }

  async testLogin(cedula, password, role) {
    this.log(`🔐 Probando login ${role}...`);
    const result = await this.makeRequest('POST', '/auth/login', { cedula, password });
    
    if (result.success && result.data.success) {
      this.log(`✅ Login ${role} exitoso: ${result.data.user.nombre} ${result.data.user.apellido}`, 'success');
      this.tokens[role] = result.data.token;
      this.tokens[`${role}_refresh`] = result.data.refreshToken;
      return true;
    } else {
      this.log(`❌ Login ${role} falló: ${result.error.message}`, 'error');
      return false;
    }
  }

  async testProfile(role) {
    this.log(`👤 Probando perfil ${role}...`);
    const result = await this.makeRequest('GET', '/auth/profile', null, this.tokens[role]);
    
    if (result.success && result.data.success) {
      this.log(`✅ Perfil ${role} obtenido: ${result.data.user.nombre} ${result.data.user.apellido}`, 'success');
      return true;
    } else {
      this.log(`❌ Error obteniendo perfil ${role}: ${result.error.message}`, 'error');
      return false;
    }
  }

  async testRegister() {
    this.log('📝 Probando registro de estudiante...');
    const studentData = {
      cedula: `${Date.now()}`.slice(-10), // Cédula única basada en timestamp
      nombre: 'Test',
      apellido: 'Student',
      email: `test.student.${Date.now()}@test.com`,
      telefono: '3009999999',
      password: 'test123'
    };

    const result = await this.makeRequest('POST', '/auth/register', studentData);
    
    if (result.success && result.data.success) {
      this.log(`✅ Registro exitoso: ${result.data.user.nombre} ${result.data.user.apellido}`, 'success');
      this.tokens.newStudent = result.data.token;
      return true;
    } else if (result.status === 409) {
      this.log('⚠️  Usuario ya existe (normal en pruebas repetidas)', 'warning');
      return true;
    } else {
      this.log(`❌ Error en registro: ${result.error.message}`, 'error');
      return false;
    }
  }

  async testVerifyToken(role) {
    this.log(`🔍 Probando verificar token ${role}...`);
    const result = await this.makeRequest('GET', '/auth/verify-token', null, this.tokens[role]);
    
    if (result.success && result.data.success) {
      this.log(`✅ Token ${role} válido`, 'success');
      return true;
    } else {
      this.log(`❌ Token ${role} inválido: ${result.error.message}`, 'error');
      return false;
    }
  }

  async testRefreshToken(role) {
    this.log(`🔄 Probando refresh token ${role}...`);
    const refreshToken = this.tokens[`${role}_refresh`];
    
    if (!refreshToken) {
      this.log(`❌ No hay refresh token para ${role}`, 'error');
      return false;
    }

    const result = await this.makeRequest('POST', '/auth/refresh-token', { refreshToken });
    
    if (result.success && result.data.success) {
      this.log(`✅ Token ${role} renovado exitosamente`, 'success');
      this.tokens[role] = result.data.token; // Actualizar token
      return true;
    } else {
      this.log(`❌ Error renovando token ${role}: ${result.error.message}`, 'error');
      return false;
    }
  }

  async testErrorCases() {
    this.log('🚨 Probando casos de error...');

    // Login con credenciales incorrectas
    this.log('Testing invalid credentials...');
    const invalidLogin = await this.makeRequest('POST', '/auth/login', {
      cedula: '1234567890',
      password: 'wrongpassword'
    });
    
    if (!invalidLogin.success && invalidLogin.status === 401) {
      this.log('✅ Error de credenciales inválidas manejado correctamente', 'success');
    } else {
      this.log('❌ Error de credenciales inválidas no manejado correctamente', 'error');
    }

    // Acceso sin token
    this.log('Testing access without token...');
    const noToken = await this.makeRequest('GET', '/auth/profile');
    
    if (!noToken.success && noToken.status === 401) {
      this.log('✅ Acceso sin token bloqueado correctamente', 'success');
    } else {
      this.log('❌ Acceso sin token no bloqueado correctamente', 'error');
    }

    // Token inválido
    this.log('Testing invalid token...');
    const invalidToken = await this.makeRequest('GET', '/auth/profile', null, 'invalid-token');
    
    if (!invalidToken.success && invalidToken.status === 401) {
      this.log('✅ Token inválido bloqueado correctamente', 'success');
    } else {
      this.log('❌ Token inválido no bloqueado correctamente', 'error');
    }
  }

  async testAdminOnlyEndpoints() {
    this.log('👑 Probando endpoints solo para admin...');
    
    // Auth stats con token de admin
    if (this.tokens.admin) {
      const adminStats = await this.makeRequest('GET', '/auth/stats', null, this.tokens.admin);
      if (adminStats.success) {
        this.log('✅ Admin puede acceder a estadísticas de auth', 'success');
      } else {
        this.log('❌ Admin no puede acceder a estadísticas de auth', 'error');
      }
    }

    // Auth stats con token de estudiante (debería fallar)
    if (this.tokens.estudiante) {
      const studentStats = await this.makeRequest('GET', '/auth/stats', null, this.tokens.estudiante);
      if (!studentStats.success && studentStats.status === 403) {
        this.log('✅ Estudiante bloqueado correctamente en endpoint de admin', 'success');
      } else {
        this.log('❌ Estudiante no bloqueado en endpoint de admin', 'error');
      }
    }
  }

  async runAllTests() {
    try {
      this.log('🚀 INICIANDO PRUEBAS COMPLETAS DE LA API', 'info');
      this.log('='.repeat(50), 'info');

      // 1. Health Check
      const healthOk = await this.testHealthCheck();
      if (!healthOk) {
        this.log('💥 Servidor no disponible, abortando pruebas', 'error');
        return;
      }

      // 2. Logins
      await this.testLogin('1234567890', 'admin123', 'admin');
      await this.testLogin('9876543210', 'profesor123', 'profesor');
      await this.testLogin('1001001001', 'estudiante123', 'estudiante');

      // 3. Registro
      await this.testRegister();

      // 4. Perfiles
      for (const role of ['admin', 'profesor', 'estudiante']) {
        if (this.tokens[role]) {
          await this.testProfile(role);
          await this.testVerifyToken(role);
          await this.testRefreshToken(role);
        }
      }

      // 5. Casos de error
      await this.testErrorCases();

      // 6. Endpoints de admin
      await this.testAdminOnlyEndpoints();

      // Resumen
      this.log('='.repeat(50), 'info');
      this.log('📊 RESUMEN DE PRUEBAS:', 'info');
      const successCount = this.results.filter(r => r.type === 'success').length;
      const errorCount = this.results.filter(r => r.type === 'error').length;
      const warningCount = this.results.filter(r => r.type === 'warning').length;
      
      this.log(`✅ Exitosas: ${successCount}`, 'success');
      this.log(`❌ Errores: ${errorCount}`, errorCount > 0 ? 'error' : 'info');
      this.log(`⚠️  Advertencias: ${warningCount}`, 'warning');

      // Guardar reporte
      this.saveReport();

    } catch (error) {
      this.log(`💥 Error crítico en las pruebas: ${error.message}`, 'error');
    }
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        success: this.results.filter(r => r.type === 'success').length,
        errors: this.results.filter(r => r.type === 'error').length,
        warnings: this.results.filter(r => r.type === 'warning').length
      },
      results: this.results
    };

    const filename = `test_report_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    this.log(`📄 Reporte guardado en: ${filename}`, 'info');
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new APITester();
  tester.runAllTests()
    .then(() => {
      console.log('\n🎉 Pruebas completadas');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en pruebas:', error.message);
      process.exit(1);
    });
}

export default APITester;