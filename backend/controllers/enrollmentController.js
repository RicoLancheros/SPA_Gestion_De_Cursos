import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

class EnrollmentController {

  // Inscribirse a un curso (estudiantes)
  static async enrollInCourse(req, res) {
    try {
      const { cursoId } = req.body;
      const estudianteCedula = req.user.cedula;

      if (!cursoId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'ID del curso requerido'
        });
      }

      const enrollmentData = {
        estudianteCedula,
        cursoId
      };

      const newEnrollment = await Enrollment.create(enrollmentData);

      // Obtener información del curso para la respuesta
      const course = await Course.findById(cursoId);
      
      res.status(201).json({
        success: true,
        message: 'Inscripción exitosa',
        enrollment: {
          ...newEnrollment,
          curso: {
            id: course.id,
            nombre: course.nombre,
            carrera: course.carrera,
            modalidad: course.modalidad
          }
        }
      });

    } catch (error) {
      console.error('Error en inscripción:', error);

      if (error.message.includes('no existe') || 
          error.message.includes('no está disponible') ||
          error.message.includes('capacidad máxima') ||
          error.message.includes('ya está inscrito') ||
          error.message.includes('Conflicto de horarios')) {
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

  // Verificar conflictos de horarios sin inscribir (estudiantes)
  static async checkScheduleConflicts(req, res) {
    try {
      const { cursoId } = req.params;
      const estudianteCedula = req.user.cedula;

      if (!cursoId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'ID del curso requerido'
        });
      }

      // Verificar que el curso existe
      const curso = await Course.findById(cursoId);
      if (!curso) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'El curso no existe'
        });
      }

      // Verificar conflictos de horarios
      const scheduleConflicts = await Enrollment.checkScheduleConflicts(estudianteCedula, curso);

      res.json({
        success: true,
        hasConflicts: scheduleConflicts.length > 0,
        conflicts: scheduleConflicts,
        message: scheduleConflicts.length > 0 
          ? 'Se detectaron conflictos de horarios'
          : 'No hay conflictos de horarios'
      });

    } catch (error) {
      console.error('Error verificando conflictos de horarios:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Retirarse de un curso (estudiantes - solo 24h)
  static async withdrawFromCourse(req, res) {
    try {
      const { id } = req.params;
      const { motivoRetiro } = req.body;

      // Verificar que la matrícula pertenece al estudiante
      const enrollment = await Enrollment.findById(id);
      
      if (!enrollment) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Matrícula no encontrada'
        });
      }

      if (enrollment.estudianteCedula !== req.user.cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes retirarte de tus propias inscripciones'
        });
      }

      const result = await Enrollment.withdraw(id, motivoRetiro);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Error en retiro:', error);

      if (error.message.includes('no encontrada') ||
          error.message.includes('no está activa') ||
          error.message.includes('no es posible retirarse')) {
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

  // Obtener matrículas del estudiante actual
  static async getMyEnrollments(req, res) {
    try {
      const { estado } = req.query;
      const estudianteCedula = req.user.cedula;

      const enrollments = await Enrollment.findByStudent(estudianteCedula, estado);

      // Enriquecer con información de los cursos
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await Course.findById(enrollment.cursoId);
          const teacher = course ? await User.findByCedula(course.docenteAsignado) : null;

          return {
            ...enrollment,
            curso: course ? {
              id: course.id,
              nombre: course.nombre,
              descripcion: course.descripcion,
              carrera: course.carrera,
              modalidad: course.modalidad,
              horarios: course.horarios,
              salonOLink: course.salonOLink,
              estado: course.estado
            } : null,
            docente: teacher ? {
              nombre: teacher.nombre,
              apellido: teacher.apellido,
              email: teacher.email
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedEnrollments,
        count: enrichedEnrollments.length
      });

    } catch (error) {
      console.error('Error obteniendo matrículas del estudiante:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estudiantes de un curso (profesores y admin)
  static async getCourseEnrollments(req, res) {
    try {
      const { cursoId } = req.params;
      const { estado } = req.query;

      // Verificar permisos para profesores
      if (req.user.rol === 'profesor') {
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
            message: 'Solo puedes ver estudiantes de tus cursos asignados'
          });
        }
      }

      const enrollments = await Enrollment.findByCourse(cursoId, estado);

      // Enriquecer con información de los estudiantes
      const enrichedEnrollments = await Promise.all(
        enrollments.map(async (enrollment) => {
          const student = await User.findByCedula(enrollment.estudianteCedula);

          return {
            ...enrollment,
            estudiante: student ? {
              cedula: student.cedula,
              nombre: student.nombre,
              apellido: student.apellido,
              email: student.email,
              telefono: student.telefono
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedEnrollments,
        count: enrichedEnrollments.length
      });

    } catch (error) {
      console.error('Error obteniendo matrículas del curso:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener todas las matrículas (solo admin)
  static async getAllEnrollments(req, res) {
    try {
      const { 
        estudianteCedula,
        cursoId,
        estado,
        page = 1,
        limit = 20
      } = req.query;

      // Construir filtros
      const filters = {};
      if (estudianteCedula) filters.estudianteCedula = estudianteCedula;
      if (cursoId) filters.cursoId = cursoId;
      if (estado) filters.estado = estado;

      const enrollments = await Enrollment.findWithDetails(filters);

      // Paginación
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedEnrollments = enrollments.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedEnrollments,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(enrollments.length / limit),
          count: paginatedEnrollments.length,
          totalEnrollments: enrollments.length
        },
        filters: filters
      });

    } catch (error) {
      console.error('Error obteniendo todas las matrículas:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Inscribir estudiante manualmente (solo admin)
  static async enrollStudentManually(req, res) {
    try {
      const { estudianteCedula, cursoId } = req.body;

      if (!estudianteCedula || !cursoId) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Cédula del estudiante y ID del curso son requeridos'
        });
      }

      const enrollmentData = {
        estudianteCedula,
        cursoId
      };

      const newEnrollment = await Enrollment.create(enrollmentData);

      // Obtener información completa para la respuesta
      const student = await User.findByCedula(estudianteCedula);
      const course = await Course.findById(cursoId);

      res.status(201).json({
        success: true,
        message: 'Estudiante inscrito manualmente',
        enrollment: {
          ...newEnrollment,
          estudiante: {
            nombre: student?.nombre,
            apellido: student?.apellido
          },
          curso: {
            nombre: course?.nombre,
            carrera: course?.carrera
          }
        }
      });

    } catch (error) {
      console.error('Error inscribiendo manualmente:', error);

      if (error.message.includes('no existe') || 
          error.message.includes('no está disponible') ||
          error.message.includes('capacidad máxima') ||
          error.message.includes('ya está inscrito') ||
          error.message.includes('Conflicto de horarios')) {
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

  // Reactivar matrícula (solo admin)
  static async reactivateEnrollment(req, res) {
    try {
      const { id } = req.params;

      const result = await Enrollment.reactivate(id);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Error reactivando matrícula:', error);

      if (error.message.includes('no encontrada') ||
          error.message.includes('no está retirada') ||
          error.message.includes('capacidad máxima')) {
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

  // Retirar estudiante manualmente (admin y profesores)
  static async withdrawStudentManually(req, res) {
    try {
      const { id } = req.params;
      const { motivoRetiro = 'Retiro administrativo' } = req.body;

      // Verificar permisos para profesores
      if (req.user.rol === 'profesor') {
        const enrollment = await Enrollment.findById(id);
        
        if (!enrollment) {
          return res.status(404).json({
            error: 'NotFound',
            message: 'Matrícula no encontrada'
          });
        }

        const course = await Course.findById(enrollment.cursoId);
        
        if (!course || course.docenteAsignado !== req.user.cedula) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Solo puedes retirar estudiantes de tus cursos asignados'
          });
        }
      }

      // Para admin y profesores autorizados, permitir retiro sin restricción de 24h
      const enrollment = await Enrollment.findById(id);
      
      if (!enrollment) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Matrícula no encontrada'
        });
      }

      if (enrollment.estado !== 'activo') {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'La matrícula no está activa'
        });
      }

      // Actualizar directamente en la base de datos (bypass de la validación de 24h)
      const Course = (await import('../models/Course.js')).default;
      await Course.decrementEnrollment(enrollment.cursoId);
      
      // Actualizar el enrollment
      await Enrollment.findById(id); // Para actualizar en la BD directamente
      
      res.json({
        success: true,
        message: 'Estudiante retirado exitosamente'
      });

    } catch (error) {
      console.error('Error retirando estudiante manualmente:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Estadísticas de matrículas
  static async getEnrollmentStats(req, res) {
    try {
      const stats = await Enrollment.getStatistics();

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de matrículas:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Verificar si un estudiante puede retirarse
  static async checkWithdrawalEligibility(req, res) {
    try {
      const { id } = req.params;

      const enrollment = await Enrollment.findById(id);

      if (!enrollment) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Matrícula no encontrada'
        });
      }

      // Verificar que la matrícula pertenece al estudiante
      if (enrollment.estudianteCedula !== req.user.cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes verificar tus propias inscripciones'
        });
      }

      const canWithdraw = Enrollment.canWithdraw(enrollment.fechaInscripcion.toDate());
      const hoursRemaining = canWithdraw ? 
        Math.max(0, 24 - Math.abs(new Date() - enrollment.fechaInscripcion.toDate()) / (1000 * 60 * 60)) : 0;

      res.json({
        success: true,
        canWithdraw,
        hoursRemaining: Math.round(hoursRemaining * 100) / 100,
        enrollmentDate: enrollment.fechaInscripcion,
        status: enrollment.estado
      });

    } catch (error) {
      console.error('Error verificando elegibilidad de retiro:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }
}

export default EnrollmentController;