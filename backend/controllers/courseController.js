import Course from '../models/Course.js';
import User from '../models/User.js';

class CourseController {

  // Obtener todos los cursos
  static async getAllCourses(req, res) {
    try {
      const { 
        estado, 
        carrera, 
        modalidad, 
        docenteAsignado,
        page = 1, 
        limit = 10 
      } = req.query;

      // Construir filtros
      const filters = {};
      if (estado) filters.estado = estado;
      if (carrera) filters.carrera = carrera;
      if (modalidad) filters.modalidad = modalidad;
      if (docenteAsignado) filters.docenteAsignado = docenteAsignado;

      // Si es profesor, solo ver cursos asignados a él
      if (req.user.rol === 'profesor') {
        filters.docenteAsignado = req.user.cedula;
      }

      const courses = await Course.findAll(filters);

      // Paginación
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedCourses = courses.slice(startIndex, endIndex);

      // Enriquecer con información del docente
      const enrichedCourses = await Promise.all(
        paginatedCourses.map(async (course) => {
          const docente = await User.findByCedula(course.docenteAsignado);
          return {
            ...course,
            docente: docente ? {
              nombre: docente.nombre,
              apellido: docente.apellido,
              email: docente.email
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedCourses,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(courses.length / limit),
          count: paginatedCourses.length,
          totalCourses: courses.length
        },
        filters: filters
      });

    } catch (error) {
      console.error('Error obteniendo cursos:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener cursos disponibles para inscripción (estudiantes)
  static async getAvailableCourses(req, res) {
    try {
      const { carrera, modalidad } = req.query;
      
      const availableCourses = await Course.findAvailable();
      
      // Aplicar filtros adicionales
      let filteredCourses = availableCourses;
      
      if (carrera) {
        filteredCourses = filteredCourses.filter(course => 
          course.carrera.toLowerCase().includes(carrera.toLowerCase())
        );
      }
      
      if (modalidad) {
        filteredCourses = filteredCourses.filter(course => 
          course.modalidad === modalidad
        );
      }

      // Enriquecer con información del docente
      const enrichedCourses = await Promise.all(
        filteredCourses.map(async (course) => {
          const docente = await User.findByCedula(course.docenteAsignado);
          return {
            ...course,
            docente: docente ? {
              nombre: docente.nombre,
              apellido: docente.apellido
            } : null,
            cuposDisponibles: course.capacidadMaxima - course.estudiantesInscritos
          };
        })
      );

      res.json({
        success: true,
        data: enrichedCourses,
        count: enrichedCourses.length
      });

    } catch (error) {
      console.error('Error obteniendo cursos disponibles:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener curso por ID
  static async getCourseById(req, res) {
    try {
      const { id } = req.params;

      const course = await Course.findById(id);

      if (!course) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Curso no encontrado'
        });
      }

      // Verificar permisos para profesores
      if (req.user.rol === 'profesor' && course.docenteAsignado !== req.user.cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes ver cursos asignados a ti'
        });
      }

      // Enriquecer con información del docente
      const docente = await User.findByCedula(course.docenteAsignado);
      const enrichedCourse = {
        ...course,
        docente: docente ? {
          cedula: docente.cedula,
          nombre: docente.nombre,
          apellido: docente.apellido,
          email: docente.email,
          telefono: docente.telefono
        } : null,
        cuposDisponibles: course.capacidadMaxima - course.estudiantesInscritos
      };

      res.json({
        success: true,
        course: enrichedCourse
      });

    } catch (error) {
      console.error('Error obteniendo curso:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Crear nuevo curso (solo admin)
  static async createCourse(req, res) {
    try {
      const courseData = {
        ...req.body,
        creadoPor: req.user.cedula
      };

      const newCourse = await Course.create(courseData);

      res.status(201).json({
        success: true,
        message: 'Curso creado exitosamente',
        course: newCourse
      });

    } catch (error) {
      console.error('Error creando curso:', error);

      if (error.message.includes('Datos inválidos')) {
        return res.status(400).json({
          error: 'BadRequest',
          message: error.message
        });
      }

      if (error.message.includes('no existe') || error.message.includes('no tiene rol')) {
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

  // Actualizar curso
  static async updateCourse(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verificar que el curso existe
      const existingCourse = await Course.findById(id);
      if (!existingCourse) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Curso no encontrado'
        });
      }

      // Verificar permisos para profesores
      if (req.user.rol === 'profesor' && existingCourse.docenteAsignado !== req.user.cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes editar cursos asignados a ti'
        });
      }

      // Los profesores no pueden cambiar ciertos campos
      if (req.user.rol === 'profesor') {
        const restrictedFields = ['docenteAsignado', 'capacidadMaxima', 'estado', 'creadoPor'];
        const hasRestrictedField = restrictedFields.some(field => updateData.hasOwnProperty(field));
        
        if (hasRestrictedField) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'No tienes permisos para modificar esos campos'
          });
        }
      }

      const updatedCourse = await Course.update(id, updateData);

      res.json({
        success: true,
        message: 'Curso actualizado exitosamente',
        course: updatedCourse
      });

    } catch (error) {
      console.error('Error actualizando curso:', error);

      if (error.message.includes('no encontrado')) {
        return res.status(404).json({
          error: 'NotFound',
          message: error.message
        });
      }

      if (error.message.includes('no existe') || error.message.includes('no tiene rol')) {
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

  // Eliminar curso (solo admin)
  static async deleteCourse(req, res) {
    try {
      const { id } = req.params;

      const result = await Course.delete(id);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Error eliminando curso:', error);

      if (error.message.includes('no encontrado')) {
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

  // Buscar cursos
  static async searchCourses(req, res) {
    try {
      const { q: searchTerm, carrera, modalidad, estado } = req.query;

      if (!searchTerm || searchTerm.trim() === '') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Término de búsqueda requerido'
        });
      }

      // Construir filtros
      const filters = {};
      if (carrera) filters.carrera = carrera;
      if (modalidad) filters.modalidad = modalidad;
      if (estado) filters.estado = estado;

      // Si es profesor, solo buscar en sus cursos
      if (req.user.rol === 'profesor') {
        filters.docenteAsignado = req.user.cedula;
      }

      const courses = await Course.search(searchTerm, filters);

      res.json({
        success: true,
        data: courses,
        count: courses.length,
        searchTerm: searchTerm
      });

    } catch (error) {
      console.error('Error buscando cursos:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Asignar profesor a curso (solo admin)
  static async assignTeacher(req, res) {
    try {
      const { id } = req.params;
      const { docenteAsignado } = req.body;

      if (!docenteAsignado) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Cédula del docente requerida'
        });
      }

      // Verificar que el profesor existe y tiene rol correcto
      const teacher = await User.findByCedula(docenteAsignado);
      if (!teacher || teacher.rol !== 'profesor') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'El usuario especificado no es un profesor válido'
        });
      }

      const updatedCourse = await Course.update(id, { docenteAsignado });

      res.json({
        success: true,
        message: 'Profesor asignado exitosamente',
        course: updatedCourse
      });

    } catch (error) {
      console.error('Error asignando profesor:', error);

      if (error.message.includes('no encontrado')) {
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

  // Obtener cursos de un profesor específico
  static async getTeacherCourses(req, res) {
    try {
      const { cedula } = req.params;

      // Verificar permisos: admin puede ver cualquier profesor, profesor solo sus cursos
      if (req.user.rol === 'profesor' && req.user.cedula !== cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes ver tus propios cursos'
        });
      }

      const courses = await Course.findAll({ docenteAsignado: cedula });

      res.json({
        success: true,
        data: courses,
        count: courses.length
      });

    } catch (error) {
      console.error('Error obteniendo cursos del profesor:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Estadísticas de cursos
  static async getCourseStats(req, res) {
    try {
      const allCourses = await Course.findAll();

      const stats = {
        totalCourses: allCourses.length,
        activeCourses: allCourses.filter(c => c.estado === 'inscripciones' || c.estado === 'iniciado').length,
        availableCourses: allCourses.filter(c => c.estado === 'inscripciones').length,
        finishedCourses: allCourses.filter(c => c.estado === 'finalizado').length,
        canceledCourses: allCourses.filter(c => c.estado === 'cancelado').length,
        total: allCourses.length,
        porEstado: {
          inscripciones: allCourses.filter(c => c.estado === 'inscripciones').length,
          iniciado: allCourses.filter(c => c.estado === 'iniciado').length,
          finalizado: allCourses.filter(c => c.estado === 'finalizado').length,
          cancelado: allCourses.filter(c => c.estado === 'cancelado').length
        },
        porModalidad: {
          presencial: allCourses.filter(c => c.modalidad === 'presencial').length,
          virtual: allCourses.filter(c => c.modalidad === 'virtual').length,
          mixta: allCourses.filter(c => c.modalidad === 'mixta').length
        },
        capacidadTotal: allCourses.reduce((sum, course) => sum + course.capacidadMaxima, 0),
        estudiantesInscritos: allCourses.reduce((sum, course) => sum + course.estudiantesInscritos, 0),
        cursosConCupos: allCourses.filter(c => c.estudiantesInscritos < c.capacidadMaxima).length
      };

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de cursos:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Cambiar estado del curso (activar/desactivar)
  static async toggleCourseStatus(req, res) {
    try {
      const { id } = req.params;

      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Curso no encontrado'
        });
      }

      // Cambiar el estado del curso
      const newState = course.estado === 'inscripciones' ? 'cancelado' : 'inscripciones';
      const updatedCourse = await Course.update(id, { estado: newState });

      res.json({
        success: true,
        message: `Curso ${newState === 'inscripciones' ? 'activado' : 'desactivado'} correctamente`,
        course: updatedCourse
      });

    } catch (error) {
      console.error('Error cambiando estado del curso:', error);

      if (error.message.includes('no encontrado')) {
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
}

export default CourseController;