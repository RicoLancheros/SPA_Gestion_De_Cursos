import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class JWTUtils {
  
  // Generar token JWT
  static generateToken(payload) {
    try {
      // Validar que el payload tenga los datos necesarios
      if (!payload.cedula || !payload.rol) {
        throw new Error('El payload debe contener al menos cedula y rol');
      }

      // Crear token con información del usuario
      const tokenPayload = {
        cedula: payload.cedula,
        rol: payload.rol,
        nombre: payload.nombre,
        apellido: payload.apellido,
        email: payload.email,
        iat: Math.floor(Date.now() / 1000) // Issued at
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'spa-gestion-cursos',
        audience: 'spa-users'
      });

      return {
        token,
        expiresIn: JWT_EXPIRES_IN,
        tokenType: 'Bearer'
      };

    } catch (error) {
      throw new Error(`Error generando token: ${error.message}`);
    }
  }

  // Verificar token JWT
  static verifyToken(token) {
    try {
      // Remover 'Bearer ' si existe
      const cleanToken = token.replace(/^Bearer\s+/, '');

      const decoded = jwt.verify(cleanToken, JWT_SECRET, {
        issuer: 'spa-gestion-cursos',
        audience: 'spa-users'
      });

      return {
        valid: true,
        decoded: decoded,
        expired: false
      };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'Token expirado'
        };
      }

      if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          decoded: null,
          expired: false,
          error: 'Token inválido'
        };
      }

      return {
        valid: false,
        decoded: null,
        expired: false,
        error: error.message
      };
    }
  }

  // Decodificar token sin verificar (útil para obtener info del token expirado)
  static decodeToken(token) {
    try {
      const cleanToken = token.replace(/^Bearer\s+/, '');
      const decoded = jwt.decode(cleanToken);
      
      return {
        success: true,
        decoded: decoded
      };
    } catch (error) {
      return {
        success: false,
        decoded: null,
        error: error.message
      };
    }
  }

  // Generar refresh token (token de larga duración)
  static generateRefreshToken(payload) {
    try {
      const refreshPayload = {
        cedula: payload.cedula,
        rol: payload.rol,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
      };

      const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, {
        expiresIn: '7d', // 7 días para refresh token
        issuer: 'spa-gestion-cursos',
        audience: 'spa-refresh'
      });

      return {
        refreshToken,
        expiresIn: '7d'
      };

    } catch (error) {
      throw new Error(`Error generando refresh token: ${error.message}`);
    }
  }

  // Verificar refresh token
  static verifyRefreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET, {
        issuer: 'spa-gestion-cursos',
        audience: 'spa-refresh'
      });

      // Verificar que es un refresh token
      if (decoded.type !== 'refresh') {
        throw new Error('No es un refresh token válido');
      }

      return {
        valid: true,
        decoded: decoded
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Renovar token usando refresh token
  static async renewToken(refreshToken) {
    try {
      const refreshVerification = JWTUtils.verifyRefreshToken(refreshToken);
      
      if (!refreshVerification.valid) {
        throw new Error('Refresh token inválido');
      }

      // Obtener datos actuales del usuario
      const User = (await import('../models/User.js')).default;
      const user = await User.findByCedula(refreshVerification.decoded.cedula);
      
      if (!user || user.estado !== 'activo') {
        throw new Error('Usuario no encontrado o inactivo');
      }

      // Generar nuevo token de acceso
      const newTokenData = JWTUtils.generateToken({
        cedula: user.cedula,
        rol: user.rol,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email
      });

      return {
        success: true,
        ...newTokenData,
        user: {
          cedula: user.cedula,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          rol: user.rol
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener información del usuario desde el token
  static getUserFromToken(token) {
    try {
      const verification = JWTUtils.verifyToken(token);
      
      if (!verification.valid) {
        return {
          success: false,
          error: verification.error
        };
      }

      return {
        success: true,
        user: {
          cedula: verification.decoded.cedula,
          rol: verification.decoded.rol,
          nombre: verification.decoded.nombre,
          apellido: verification.decoded.apellido,
          email: verification.decoded.email
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validar que el JWT_SECRET sea seguro
  static validateJWTSecret() {
    if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-key') {
      console.warn('⚠️  WARNING: JWT_SECRET no configurado o usando valor por defecto');
      console.warn('⚠️  Configura una clave segura en la variable JWT_SECRET');
      return false;
    }

    if (JWT_SECRET.length < 32) {
      console.warn('⚠️  WARNING: JWT_SECRET muy corto. Usa al menos 32 caracteres');
      return false;
    }

    return true;
  }

  // Blacklist de tokens (en memoria - en producción usar Redis o DB)
  static tokenBlacklist = new Set();

  // Invalidar token (logout)
  static invalidateToken(token) {
    try {
      const cleanToken = token.replace(/^Bearer\s+/, '');
      JWTUtils.tokenBlacklist.add(cleanToken);
      
      return {
        success: true,
        message: 'Token invalidado correctamente'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verificar si un token está en blacklist
  static isTokenBlacklisted(token) {
    const cleanToken = token.replace(/^Bearer\s+/, '');
    return JWTUtils.tokenBlacklist.has(cleanToken);
  }

  // Limpiar tokens expirados de la blacklist (ejecutar periódicamente)
  static cleanupBlacklist() {
    try {
      let removedCount = 0;
      
      JWTUtils.tokenBlacklist.forEach(token => {
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
          const now = Math.floor(Date.now() / 1000);
          if (decoded.exp < now) {
            JWTUtils.tokenBlacklist.delete(token);
            removedCount++;
          }
        }
      });

      console.log(`🧹 Blacklist limpiada: ${removedCount} tokens expirados removidos`);
      return removedCount;

    } catch (error) {
      console.error('Error limpiando blacklist:', error.message);
      return 0;
    }
  }
}

// Validar JWT_SECRET al importar el módulo
JWTUtils.validateJWTSecret();

// Limpiar blacklist cada hora
setInterval(() => {
  JWTUtils.cleanupBlacklist();
}, 60 * 60 * 1000); // 1 hora

export default JWTUtils;