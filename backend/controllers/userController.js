import User from '../models/User.js';

class UserController {

  // Obtener todos los usuarios (solo admin)
  static async getAllUsers(req, res) {
    try {
      const { rol, estado, page = 1, limit = 10 } = req.query;
      
      // Construir filtros
      const filters = {};
      if (rol) filters.rol = rol;
      if (estado) filters.estado = estado;

      // Obtener usuarios
      const users = await User.findAll(filters);

      // Paginación básica
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedUsers,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(users.length / limit),
          count: paginatedUsers.length,
          totalUsers: users.length
        }
      });

    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener usuario por cédula
  static async getUserByCedula(req, res) {
    try {
      const { cedula } = req.params;

      // Verificar permisos: admin puede ver cualquier usuario, otros solo el suyo
      if (req.user.rol !== 'administrador' && req.user.cedula !== cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes acceder a tu propia información'
        });
      }

      const user = await User.findByCedula(cedula);

      if (!user) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        user: user
      });

    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Buscar usuarios (solo admin)
  static async searchUsers(req, res) {
    try {
      const { q: searchTerm, rol } = req.query;

      if (!searchTerm || searchTerm.trim() === '') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Término de búsqueda requerido'
        });
      }

      const users = await User.search(searchTerm, rol);

      res.json({
        success: true,
        data: users,
        count: users.length,
        searchTerm: searchTerm
      });

    } catch (error) {
      console.error('Error buscando usuarios:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear usuario (solo admin - para profesores)
  static async createUser(req, res) {
    try {
      const {
        cedula,
        nombre,
        apellido,
        email,
        telefono,
        password,
        rol
      } = req.body;

      // Solo permitir creación de profesores y administradores
      if (rol === 'estudiante') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Los estudiantes deben registrarse mediante /api/auth/register'
        });
      }

      if (!['profesor', 'administrador'].includes(rol)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Rol debe ser: profesor o administrador'
        });
      }

      const userData = {
        cedula,
        nombre,
        apellido,
        email,
        telefono,
        password,
        rol
      };

      const newUser = await User.create(userData);

      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        user: newUser
      });

    } catch (error) {
      console.error('Error creando usuario:', error);

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

  // Actualizar usuario
  static async updateUser(req, res) {
    try {
      const { cedula } = req.params;
      const updateData = req.body;

      // Verificar permisos
      if (req.user.rol !== 'administrador' && req.user.cedula !== cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes actualizar tu propia información'
        });
      }

      // Los no-admin no pueden cambiar rol
      if (req.user.rol !== 'administrador' && updateData.rol) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'No tienes permisos para cambiar el rol'
        });
      }

      // Verificar que hay algo que actualizar
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'No hay datos para actualizar'
        });
      }

      const updatedUser = await User.update(cedula, updateData);

      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        user: updatedUser
      });

    } catch (error) {
      console.error('Error actualizando usuario:', error);

      if (error.message.includes('Usuario no encontrado')) {
        return res.status(404).json({
          error: 'NotFound',
          message: error.message
        });
      }

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

  // Desactivar usuario (solo admin)
  static async deactivateUser(req, res) {
    try {
      const { cedula } = req.params;

      // No permitir que el admin se desactive a sí mismo
      if (req.user.cedula === cedula) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'No puedes desactivarte a ti mismo'
        });
      }

      const result = await User.delete(cedula);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Error desactivando usuario:', error);

      if (error.message.includes('Usuario no encontrado')) {
        return res.status(404).json({
          error: 'NotFound',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Activar usuario (solo admin)
  static async activateUser(req, res) {
    try {
      const { cedula } = req.params;

      const updatedUser = await User.update(cedula, { estado: 'activo' });

      res.json({
        success: true,
        message: 'Usuario activado exitosamente',
        user: updatedUser
      });

    } catch (error) {
      console.error('Error activando usuario:', error);

      if (error.message.includes('Usuario no encontrado')) {
        return res.status(404).json({
          error: 'NotFound',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener profesores (para asignar a cursos)
  static async getTeachers(req, res) {
    try {
      const { estado = 'activo' } = req.query;

      const teachers = await User.findAll({ rol: 'profesor', estado });

      res.json({
        success: true,
        data: teachers,
        count: teachers.length
      });

    } catch (error) {
      console.error('Error obteniendo profesores:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estudiantes (para administradores y profesores)
  static async getStudents(req, res) {
    try {
      const { estado = 'activo', page = 1, limit = 20 } = req.query;

      const students = await User.findAll({ rol: 'estudiante', estado });

      // Paginación
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedStudents = students.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedStudents,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(students.length / limit),
          count: paginatedStudents.length,
          totalStudents: students.length
        }
      });

    } catch (error) {
      console.error('Error obteniendo estudiantes:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estudiantes inscritos en los cursos de un profesor específico
  static async getTeacherStudents(req, res) {
    try {
      const { cedula } = req.params;

      // Verificar permisos: admin puede ver cualquier profesor, profesor solo sus propios estudiantes
      if (req.user.rol === 'profesor' && req.user.cedula !== cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes ver tus propios estudiantes'
        });
      }

      // Importar dependencias necesarias
      const Course = (await import('../models/Course.js')).default;
      const Enrollment = (await import('../models/Enrollment.js')).default;

      // Obtener cursos del profesor
      const courses = await Course.findAll({ docenteAsignado: cedula });

      if (courses.length === 0) {
        return res.json({
          success: true,
          data: [],
          count: 0,
          message: 'El profesor no tiene cursos asignados'
        });
      }

      // Obtener todas las inscripciones activas de estos cursos
      const courseIds = courses.map(course => course.id);
      const allEnrollments = [];

      for (const courseId of courseIds) {
        const enrollments = await Enrollment.findByCourse(courseId, 'activo');
        allEnrollments.push(...enrollments);
      }

      // Obtener estudiantes únicos (sin duplicados)
      const studentCedulas = [...new Set(allEnrollments.map(e => e.estudianteCedula))];

      // Obtener información completa de los estudiantes
      const students = [];
      for (const studentCedula of studentCedulas) {
        const student = await User.findByCedula(studentCedula);
        if (student && student.rol === 'estudiante' && student.estado === 'activo') {
          // Agregar información de cursos en los que está inscrito
          const studentCourses = courses.filter(course => 
            allEnrollments.some(e => e.estudianteCedula === studentCedula && e.cursoId === course.id)
          );

          students.push({
            ...student,
            cursosInscritos: studentCourses.map(course => ({
              id: course.id,
              nombre: course.nombre,
              carrera: course.carrera
            }))
          });
        }
      }

      res.json({
        success: true,
        data: students,
        count: students.length,
        teacherInfo: {
          cedula,
          totalCourses: courses.length,
          courseNames: courses.map(c => c.nombre)
        }
      });

    } catch (error) {
      console.error('Error obteniendo estudiantes del profesor:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Estadísticas de usuarios (solo admin)
  static async getUserStats(req, res) {
    try {
      const allUsers = await User.findAll();

      const stats = {
        totalUsers: allUsers.length,
        totalStudents: allUsers.filter(u => u.rol === 'estudiante').length,
        totalTeachers: allUsers.filter(u => u.rol === 'profesor').length,
        totalAdmins: allUsers.filter(u => u.rol === 'administrador').length,
        activeUsers: allUsers.filter(u => u.estado === 'activo').length,
        inactiveUsers: allUsers.filter(u => u.estado === 'inactivo').length,
        porRol: {
          administrador: allUsers.filter(u => u.rol === 'administrador').length,
          profesor: allUsers.filter(u => u.rol === 'profesor').length,
          estudiante: allUsers.filter(u => u.rol === 'estudiante').length
        },
        porEstado: {
          activo: allUsers.filter(u => u.estado === 'activo').length,
          inactivo: allUsers.filter(u => u.estado === 'inactivo').length
        },
        registrosRecientes: allUsers
          .filter(u => {
            try {
              const registroDate = u.fechaRegistro?.seconds ? 
                new Date(u.fechaRegistro.seconds * 1000) : 
                new Date(u.fechaRegistro);
              const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return registroDate >= sevenDaysAgo;
            } catch (e) {
              return false;
            }
          })
          .length
      };

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de usuarios:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }
}

export default UserController;