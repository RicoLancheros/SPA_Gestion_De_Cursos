import JWTUtils from '../utils/jwt.js';
import User from '../models/User.js';

class AuthMiddleware {

  // Middleware principal de autenticación
  static authenticate(req, res, next) {
    try {
      // Obtener token del header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token de acceso requerido'
        });
      }

      // Verificar formato del header (Bearer token)
      if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Formato de token inválido. Use: Bearer <token>'
        });
      }

      const token = authHeader.substring(7); // Remover 'Bearer '

      // Verificar si el token está en blacklist
      if (JWTUtils.isTokenBlacklisted(token)) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token invalidado'
        });
      }

      // Verificar token
      const verification = JWTUtils.verifyToken(token);

      if (!verification.valid) {
        if (verification.expired) {
          return res.status(401).json({
            error: 'TokenExpired',
            message: 'Token expirado'
          });
        }

        return res.status(401).json({
          error: 'Unauthorized',
          message: verification.error || 'Token inválido'
        });
      }

      // Agregar información del usuario al request
      req.user = {
        cedula: verification.decoded.cedula,
        rol: verification.decoded.rol,
        nombre: verification.decoded.nombre,
        apellido: verification.decoded.apellido,
        email: verification.decoded.email
      };

      req.token = token;

      next();

    } catch (error) {
      console.error('Error en middleware de autenticación:', error);
      return res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Middleware para verificar roles específicos
  static requireRole(allowedRoles) {
    return (req, res, next) => {
      try {
        // Verificar que el usuario esté autenticado
        if (!req.user) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Autenticación requerida'
          });
        }

        // Convertir a array si es un string
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        // Verificar que el rol del usuario esté permitido
        if (!roles.includes(req.user.rol)) {
          return res.status(403).json({
            error: 'Forbidden',
            message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`
          });
        }

        next();

      } catch (error) {
        console.error('Error en middleware de roles:', error);
        return res.status(500).json({
          error: 'InternalServerError',
          message: 'Error interno del servidor'
        });
      }
    };
  }

  // Middleware para administradores únicamente
  static requireAdmin(req, res, next) {
    return AuthMiddleware.requireRole('administrador')(req, res, next);
  }

  // Middleware para profesores únicamente
  static requireTeacher(req, res, next) {
    return AuthMiddleware.requireRole('profesor')(req, res, next);
  }

  // Middleware para estudiantes únicamente
  static requireStudent(req, res, next) {
    return AuthMiddleware.requireRole('estudiante')(req, res, next);
  }

  // Middleware para profesores y administradores
  static requireAdminOrTeacher(req, res, next) {
    return AuthMiddleware.requireRole(['administrador', 'profesor'])(req, res, next);
  }

  // Middleware para verificar que el usuario esté activo
  static async requireActiveUser(req, res, next) {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Autenticación requerida'
        });
      }

      // Obtener usuario actual de la base de datos
      const user = await User.findByCedula(req.user.cedula);

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Usuario no encontrado'
        });
      }

      if (user.estado !== 'activo') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Usuario inactivo'
        });
      }

      // Actualizar información del usuario en el request con datos frescos
      req.user = {
        ...req.user,
        estado: user.estado,
        fechaUltimoAcceso: user.fechaUltimoAcceso
      };

      // Actualizar fecha de último acceso
      User.updateLastAccess(user.cedula).catch(console.error);

      next();

    } catch (error) {
      console.error('Error verificando usuario activo:', error);
      return res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Middleware para verificar propiedad de recurso
  static requireOwnership(resourceField = 'cedula') {
    return (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Autenticación requerida'
          });
        }

        // Los administradores pueden acceder a cualquier recurso
        if (req.user.rol === 'administrador') {
          return next();
        }

        // Obtener el valor del campo del recurso desde los parámetros o cuerpo
        const resourceValue = req.params[resourceField] || req.body[resourceField];

        if (!resourceValue) {
          return res.status(400).json({
            error: 'BadRequest',
            message: `Campo ${resourceField} requerido`
          });
        }

        // Verificar que el usuario sea propietario del recurso
        if (req.user.cedula !== resourceValue) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Solo puedes acceder a tus propios recursos'
          });
        }

        next();

      } catch (error) {
        console.error('Error en middleware de propiedad:', error);
        return res.status(500).json({
          error: 'InternalServerError',
          message: 'Error interno del servidor'
        });
      }
    };
  }

  // Middleware opcional (no falla si no hay token)
  static optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No hay token, continuar sin usuario
        req.user = null;
        return next();
      }

      const token = authHeader.substring(7);

      // Verificar token solo si está presente
      const verification = JWTUtils.verifyToken(token);

      if (verification.valid) {
        req.user = {
          cedula: verification.decoded.cedula,
          rol: verification.decoded.rol,
          nombre: verification.decoded.nombre,
          apellido: verification.decoded.apellido,
          email: verification.decoded.email
        };
        req.token = token;
      } else {
        req.user = null;
      }

      next();

    } catch (error) {
      console.error('Error en middleware de auth opcional:', error);
      req.user = null;
      next();
    }
  }

  // Middleware para verificar permisos en curso específico
  static async requireCoursePermission(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Autenticación requerida'
        });
      }

      // Los administradores tienen acceso a todos los cursos
      if (req.user.rol === 'administrador') {
        return next();
      }

      const cursoId = req.params.cursoId || req.params.id || req.body.cursoId;

      if (!cursoId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'ID del curso requerido'
        });
      }

      // Si es profesor, verificar que el curso esté asignado a él
      if (req.user.rol === 'profesor') {
        const Course = (await import('../models/Course.js')).default;
        const course = await Course.findById(cursoId);

        if (!course) {
          return res.status(404).json({
            error: 'NotFound',
            message: 'Curso no encontrado'
          });
        }

        if (course.docenteAsignado !== req.user.cedula) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Solo puedes gestionar cursos asignados a ti'
          });
        }
      }

      next();

    } catch (error) {
      console.error('Error en middleware de permisos de curso:', error);
      return res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }
}

// Middleware de manejo de errores de autenticación
export const handleAuthError = (error, req, res, next) => {
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido o expirado'
    });
  }

  next(error);
};

// Exportar métodos individuales para facilitar importación
export const authenticate = AuthMiddleware.authenticate;
export const requireRole = AuthMiddleware.requireRole;
export const requireAdmin = AuthMiddleware.requireAdmin;
export const requireTeacher = AuthMiddleware.requireTeacher;
export const requireStudent = AuthMiddleware.requireStudent;
export const requireAdminOrTeacher = AuthMiddleware.requireAdminOrTeacher;
export const requireActiveUser = AuthMiddleware.requireActiveUser;
export const requireOwnership = AuthMiddleware.requireOwnership;
export const optionalAuth = AuthMiddleware.optionalAuth;
export const requireCoursePermission = AuthMiddleware.requireCoursePermission;

export default AuthMiddleware;