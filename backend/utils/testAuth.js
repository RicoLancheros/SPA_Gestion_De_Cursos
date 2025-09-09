import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

class AuthTester {

  static async testHealthCheck() {
    try {
      console.log('🔍 Probando health check...');
      const response = await axios.get(`${API_BASE}/health`);
      console.log('✅ Health check exitoso:', response.data.message);
      return true;
    } catch (error) {
      console.error('❌ Error en health check:', error.message);
      return false;
    }
  }

  static async testLogin() {
    try {
      console.log('🔐 Probando login...');
      
      // Usar las credenciales que creamos anteriormente
      const loginData = {
        cedula: '1234567890', // Admin
        password: 'admin123'
      };

      const response = await axios.post(`${API_BASE}/auth/login`, loginData);
      
      if (response.data.success) {
        console.log('✅ Login exitoso para:', response.data.user.nombre, response.data.user.apellido);
        console.log('📱 Rol:', response.data.user.rol);
        console.log('🔑 Token recibido:', response.data.token ? 'Sí' : 'No');
        
        return {
          success: true,
          token: response.data.token,
          user: response.data.user,
          refreshToken: response.data.refreshToken
        };
      } else {
        console.error('❌ Login falló');
        return { success: false };
      }

    } catch (error) {
      console.error('❌ Error en login:', error.response?.data?.message || error.message);
      return { success: false };
    }
  }

  static async testProfile(token) {
    try {
      console.log('👤 Probando obtener perfil...');
      
      const response = await axios.get(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        console.log('✅ Perfil obtenido:', response.data.user.nombre, response.data.user.apellido);
        console.log('📧 Email:', response.data.user.email);
        return true;
      } else {
        console.error('❌ Error obteniendo perfil');
        return false;
      }

    } catch (error) {
      console.error('❌ Error en perfil:', error.response?.data?.message || error.message);
      return false;
    }
  }

  static async testVerifyToken(token) {
    try {
      console.log('🔍 Probando verificar token...');
      
      const response = await axios.get(`${API_BASE}/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        console.log('✅ Token válido para:', response.data.user.nombre);
        return true;
      } else {
        console.error('❌ Token inválido');
        return false;
      }

    } catch (error) {
      console.error('❌ Error verificando token:', error.response?.data?.message || error.message);
      return false;
    }
  }

  static async testRegister() {
    try {
      console.log('📝 Probando registro de estudiante...');
      
      // Crear un estudiante de prueba
      const registerData = {
        cedula: '9999999999',
        nombre: 'Test',
        apellido: 'Student',
        email: 'test.student@test.com',
        telefono: '3009999999',
        password: 'test123'
      };

      const response = await axios.post(`${API_BASE}/auth/register`, registerData);
      
      if (response.data.success) {
        console.log('✅ Registro exitoso para:', response.data.user.nombre, response.data.user.apellido);
        console.log('📱 Rol asignado:', response.data.user.rol);
        return {
          success: true,
          token: response.data.token,
          user: response.data.user
        };
      } else {
        console.error('❌ Registro falló');
        return { success: false };
      }

    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️  Usuario ya existe (es normal en pruebas repetidas)');
        return { success: true, existing: true };
      }
      console.error('❌ Error en registro:', error.response?.data?.message || error.message);
      return { success: false };
    }
  }

  static async testRefreshToken(refreshToken) {
    try {
      console.log('🔄 Probando refresh token...');
      
      const response = await axios.post(`${API_BASE}/auth/refresh-token`, {
        refreshToken: refreshToken
      });

      if (response.data.success) {
        console.log('✅ Token renovado exitosamente');
        console.log('🔑 Nuevo token recibido:', response.data.token ? 'Sí' : 'No');
        return {
          success: true,
          token: response.data.token
        };
      } else {
        console.error('❌ Error renovando token');
        return { success: false };
      }

    } catch (error) {
      console.error('❌ Error en refresh token:', error.response?.data?.message || error.message);
      return { success: false };
    }
  }

  static async testLogout(token) {
    try {
      console.log('🚪 Probando logout...');
      
      const response = await axios.post(`${API_BASE}/auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        console.log('✅ Logout exitoso');
        return true;
      } else {
        console.error('❌ Error en logout');
        return false;
      }

    } catch (error) {
      console.error('❌ Error en logout:', error.response?.data?.message || error.message);
      return false;
    }
  }

  static async runFullTest() {
    try {
      console.log('🚀 Iniciando pruebas del sistema de autenticación\n');

      // 1. Health check
      const healthCheck = await this.testHealthCheck();
      if (!healthCheck) {
        console.error('💥 Servidor no disponible, abortando pruebas');
        return;
      }
      console.log('');

      // 2. Registro
      const registerResult = await this.testRegister();
      console.log('');

      // 3. Login
      const loginResult = await this.testLogin();
      if (!loginResult.success) {
        console.error('💥 Login falló, abortando pruebas');
        return;
      }
      console.log('');

      // 4. Verificar token
      await this.testVerifyToken(loginResult.token);
      console.log('');

      // 5. Obtener perfil
      await this.testProfile(loginResult.token);
      console.log('');

      // 6. Refresh token
      if (loginResult.refreshToken) {
        const refreshResult = await this.testRefreshToken(loginResult.refreshToken);
        console.log('');
      }

      // 7. Logout
      await this.testLogout(loginResult.token);
      console.log('');

      console.log('🎉 Pruebas del sistema de autenticación completadas');

    } catch (error) {
      console.error('💥 Error en pruebas:', error.message);
    }
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  AuthTester.runFullTest()
    .then(() => {
      console.log('\n✅ Todas las pruebas ejecutadas');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en las pruebas:', error.message);
      process.exit(1);
    });
}

export default AuthTester;