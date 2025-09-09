import User from '../models/User.js';
import JWTUtils from '../utils/jwt.js';

class AuthController {

  // Registrar nuevo usuario (solo estudiantes)
  static async register(req, res) {
    try {
      const { 
        cedula, 
        nombre, 
        apellido, 
        email, 
        telefono, 
        password 
      } = req.body;

      // Validar que todos los campos requeridos estén presentes
      if (!cedula || !nombre || !apellido || !email || !password) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Todos los campos son requeridos: cedula, nombre, apellido, email, password'
        });
      }

      // Solo permitir registro de estudiantes
      const userData = {
        cedula,
        nombre,
        apellido,
        email,
        telefono,
        password,
        rol: 'estudiante' // Forzar rol de estudiante
      };

      // Crear usuario
      const newUser = await User.create(userData);

      // Generar tokens
      const tokenData = JWTUtils.generateToken({
        cedula: newUser.cedula,
        rol: newUser.rol,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        email: newUser.email
      });

      const refreshTokenData = JWTUtils.generateRefreshToken({
        cedula: newUser.cedula,
        rol: newUser.rol
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: {
          cedula: newUser.cedula,
          nombre: newUser.nombre,
          apellido: newUser.apellido,
          email: newUser.email,
          telefono: newUser.telefono,
          rol: newUser.rol,
          fechaRegistro: newUser.fechaRegistro
        },
        ...tokenData,
        refreshToken: refreshTokenData.refreshToken
      });

    } catch (error) {
      console.error('Error en registro:', error);
      
      // Manejar errores específicos
      if (error.message.includes('Ya existe un usuario')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message
        });
      }

      if (error.message.includes('Datos inválidos')) {
        return res.status(400).json({
          error: 'BadRequest',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Iniciar sesión
  static async login(req, res) {
    try {
      const { cedula, password } = req.body;

      // Validar campos requeridos
      if (!cedula || !password) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Cédula y contraseña son requeridas'
        });
      }

      // Buscar usuario por cédula
      const user = await User.findByCedula(cedula);

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Credenciales inválidas'
        });
      }

      // Verificar que el usuario esté activo
      if (user.estado !== 'activo') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Usuario inactivo. Contacte al administrador'
        });
      }

      // Verificar contraseña
      const isValidPassword = await User.verifyPassword(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Credenciales inválidas'
        });
      }

      // Actualizar fecha de último acceso
      User.updateLastAccess(user.cedula).catch(console.error);

      // Generar tokens
      const tokenData = JWTUtils.generateToken({
        cedula: user.cedula,
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email
      });

      const refreshTokenData = JWTUtils.generateRefreshToken({
        cedula: user.cedula,
        rol: user.rol
      });

      res.json({
        success: true,
        message: 'Inicio de sesión exitoso',
        user: {
          cedula: user.cedula,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          telefono: user.telefono,
          rol: user.rol,
          fechaUltimoAcceso: user.fechaUltimoAcceso
        },
        ...tokenData,
        refreshToken: refreshTokenData.refreshToken
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Cerrar sesión
  static async logout(req, res) {
    try {
      const token = req.token;

      if (!token) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Token requerido'
        });
      }

      // Invalidar token (agregarlo a blacklist)
      const result = JWTUtils.invalidateToken(token);

      if (!result.success) {
        return res.status(500).json({
          error: 'InternalServerError',
          message: 'Error invalidando token'
        });
      }

      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });

    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Renovar token usando refresh token
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Refresh token requerido'
        });
      }

      // Renovar token
      const result = await JWTUtils.renewToken(refreshToken);

      if (!result.success) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: result.error
        });
      }

      res.json({
        success: true,
        message: 'Token renovado exitosamente',
        token: result.token,
        expiresIn: result.expiresIn,
        tokenType: result.tokenType,
        user: result.user
      });

    } catch (error) {
      console.error('Error renovando token:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener perfil del usuario actual
  static async getProfile(req, res) {
    try {
      const { cedula } = req.user;

      // Obtener datos actuales del usuario
      const user = await User.findByCedula(cedula);

      if (!user) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        user: {
          cedula: user.cedula,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          telefono: user.telefono,
          rol: user.rol,
          fechaRegistro: user.fechaRegistro,
          fechaUltimoAcceso: user.fechaUltimoAcceso,
          estado: user.estado
        }
      });

    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar perfil del usuario actual
  static async updateProfile(req, res) {
    try {
      const { cedula } = req.user;
      const { nombre, apellido, email, telefono, password } = req.body;

      // Crear objeto con solo los campos a actualizar
      const updateData = {};
      
      if (nombre) updateData.nombre = nombre;
      if (apellido) updateData.apellido = apellido;
      if (email) updateData.email = email;
      if (telefono) updateData.telefono = telefono;
      if (password) updateData.password = password;

      // Verificar que hay algo que actualizar
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'No hay datos para actualizar'
        });
      }

      // Actualizar usuario
      const updatedUser = await User.update(cedula, updateData);

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        user: {
          cedula: updatedUser.cedula,
          nombre: updatedUser.nombre,
          apellido: updatedUser.apellido,
          email: updatedUser.email,
          telefono: updatedUser.telefono,
          rol: updatedUser.rol
        }
      });

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      
      if (error.message.includes('Ya existe un usuario')) {
        return res.status(409).json({
          error: 'Conflict',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const { cedula } = req.user;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Contraseña actual y nueva contraseña son requeridas'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Obtener usuario actual
      const user = await User.findByCedula(cedula);

      if (!user) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Usuario no encontrado'
        });
      }

      // Verificar contraseña actual
      const isValidPassword = await User.verifyPassword(currentPassword, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Contraseña actual incorrecta'
        });
      }

      // Actualizar contraseña
      await User.update(cedula, { password: newPassword });

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar token (endpoint para validar si el token es válido)
  static async verifyToken(req, res) {
    try {
      // Si llegó hasta aquí, el token es válido (pasó por el middleware)
      res.json({
        success: true,
        message: 'Token válido',
        user: req.user
      });
    } catch (error) {
      console.error('Error verificando token:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas de sesiones (solo admin)
  static async getAuthStats(req, res) {
    try {
      const stats = {
        tokensBlacklisted: JWTUtils.tokenBlacklist.size,
        jwtConfig: {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          issuer: 'spa-gestion-cursos'
        }
      };

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de auth:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }
}

export default AuthController;