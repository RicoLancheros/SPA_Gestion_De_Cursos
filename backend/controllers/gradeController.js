import Grade from '../models/Grade.js';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

class GradeController {

  // Crear calificación (profesores del curso)
  static async createGrade(req, res) {
    try {
      const {
        estudianteCedula,
        cursoId,
        tipo,
        nota,
        descripcion,
        peso,
        observaciones,
        fechaEvaluacion
      } = req.body;

      if (!estudianteCedula || !cursoId || !tipo || nota === undefined) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Cédula del estudiante, ID del curso, tipo de evaluación y nota son requeridos'
        });
      }

      // Verificar que el profesor puede calificar este curso
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
            message: 'Solo puedes calificar estudiantes de tus cursos asignados'
          });
        }
      }

      // Verificar que el estudiante está inscrito en el curso
      const enrollments = await Enrollment.findByStudent(estudianteCedula);
      const activeEnrollment = enrollments.find(e => 
        e.cursoId === cursoId && e.estado === 'activo'
      );

      if (!activeEnrollment) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'El estudiante no está inscrito activamente en este curso'
        });
      }

      const gradeData = {
        estudianteCedula,
        cursoId,
        profesorCedula: req.user.cedula,
        tipo,
        nota: parseFloat(nota),
        descripcion,
        peso: peso ? parseFloat(peso) : 1,
        observaciones: observaciones || null,
        fechaEvaluacion: fechaEvaluacion ? new Date(fechaEvaluacion) : new Date()
      };

      const newGrade = await Grade.create(gradeData);

      // Obtener información adicional para la respuesta
      const student = await User.findByCedula(estudianteCedula);
      const course = await Course.findById(cursoId);

      res.status(201).json({
        success: true,
        message: 'Calificación creada exitosamente',
        grade: {
          ...newGrade,
          estudiante: {
            nombre: student?.nombre,
            apellido: student?.apellido
          },
          curso: {
            nombre: course?.nombre
          }
        }
      });

    } catch (error) {
      console.error('Error creando calificación:', error);

      if (error.message.includes('Datos inválidos') ||
          error.message.includes('ya existe una calificación')) {
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

  // Obtener calificaciones de un estudiante (estudiante solo las suyas, profesor sus cursos, admin todas)
  static async getStudentGrades(req, res) {
    try {
      const { cedula } = req.params;
      const { cursoId, tipoEvaluacion } = req.query;

      // Verificar permisos
      if (req.user.rol === 'estudiante' && req.user.cedula !== cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes ver tus propias calificaciones'
        });
      }

      // Construir filtros
      const filters = { estudianteCedula: cedula };
      if (cursoId) filters.cursoId = cursoId;
      if (tipoEvaluacion) filters.tipoEvaluacion = tipoEvaluacion;

      const grades = await Grade.findByStudent(cedula, filters);

      // Si es profesor, filtrar solo sus cursos
      let filteredGrades = grades;
      if (req.user.rol === 'profesor') {
        const teacherCourses = await Course.findAll({ docenteAsignado: req.user.cedula });
        const teacherCourseIds = teacherCourses.map(c => c.id);
        filteredGrades = grades.filter(grade => teacherCourseIds.includes(grade.cursoId));
      }

      // Enriquecer con información de cursos
      const enrichedGrades = await Promise.all(
        filteredGrades.map(async (grade) => {
          const course = await Course.findById(grade.cursoId);
          const teacher = grade.docenteCedula ? await User.findByCedula(grade.docenteCedula) : null;

          return {
            ...grade,
            curso: course ? {
              nombre: course.nombre,
              carrera: course.carrera
            } : null,
            docente: teacher ? {
              nombre: teacher.nombre,
              apellido: teacher.apellido
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedGrades,
        count: enrichedGrades.length,
        filters: filters
      });

    } catch (error) {
      console.error('Error obteniendo calificaciones del estudiante:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener calificaciones de una tarea específica
  static async getTaskGrades(req, res) {
    try {
      const { taskId } = req.params;

      // Verificar que la tarea existe
      const Task = (await import('../models/Task.js')).default;
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Tarea no encontrada'
        });
      }

      // Verificar permisos para profesores
      if (req.user.rol === 'profesor' && task.profesorCedula !== req.user.cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes ver calificaciones de tus propias tareas'
        });
      }

      const grades = await Grade.findByTask(taskId);

      // Enriquecer con información de estudiantes
      const enrichedGrades = await Promise.all(
        grades.map(async (grade) => {
          const student = await User.findByCedula(grade.estudianteCedula);

          return {
            ...grade,
            estudiante: student ? {
              cedula: student.cedula,
              nombre: student.nombre,
              apellido: student.apellido,
              email: student.email
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedGrades,
        count: enrichedGrades.length,
        task: {
          id: task.id,
          titulo: task.titulo,
          descripcion: task.descripcion,
          tipo: task.tipo
        }
      });

    } catch (error) {
      console.error('Error obteniendo calificaciones de la tarea:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener calificaciones de un curso (profesores del curso y admin)
  static async getCourseGrades(req, res) {
    try {
      const { cursoId } = req.params;
      const { estudianteCedula, tipo } = req.query;

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
            message: 'Solo puedes ver calificaciones de tus cursos asignados'
          });
        }
      }

      // Obtener calificaciones del curso
      const grades = await Grade.findByCourse(cursoId, tipo);

      // Filtrar por estudiante si se especifica
      let filteredGrades = grades;
      if (estudianteCedula) {
        filteredGrades = grades.filter(grade => grade.estudianteCedula === estudianteCedula);
      }

      // Enriquecer con información de estudiantes
      const enrichedGrades = await Promise.all(
        filteredGrades.map(async (grade) => {
          const student = await User.findByCedula(grade.estudianteCedula);

          return {
            ...grade,
            estudiante: student ? {
              cedula: student.cedula,
              nombre: student.nombre,
              apellido: student.apellido,
              email: student.email
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedGrades,
        count: enrichedGrades.length,
        filters: {
          cursoId,
          estudianteCedula: estudianteCedula || null,
          tipo: tipo || null
        }
      });

    } catch (error) {
      console.error('Error obteniendo calificaciones del curso:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar calificación (profesor del curso y admin)
  static async updateGrade(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verificar que la calificación existe
      const existingGrade = await Grade.findById(id);
      if (!existingGrade) {
        return res.status(404).json({
          error: 'NotFound',
          message: 'Calificación no encontrada'
        });
      }

      // Verificar permisos para profesores
      if (req.user.rol === 'profesor') {
        const course = await Course.findById(existingGrade.cursoId);
        
        if (!course || course.docenteAsignado !== req.user.cedula) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Solo puedes editar calificaciones de tus cursos asignados'
          });
        }
      }

      // Verificar que hay algo que actualizar
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'No hay datos para actualizar'
        });
      }

      // Convertir datos si es necesario
      if (updateData.nota !== undefined) {
        updateData.nota = parseFloat(updateData.nota);
      }
      if (updateData.peso !== undefined) {
        updateData.peso = parseFloat(updateData.peso);
      }
      if (updateData.fechaEvaluacion) {
        updateData.fechaEvaluacion = new Date(updateData.fechaEvaluacion);
      }

      const profesorCedula = req.user.rol === 'administrador' ? null : req.user.cedula;
      const updatedGrade = await Grade.update(id, updateData, profesorCedula);

      res.json({
        success: true,
        message: 'Calificación actualizada exitosamente',
        grade: updatedGrade
      });

    } catch (error) {
      console.error('Error actualizando calificación:', error);

      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          error: 'NotFound',
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

  // Eliminar calificación (admin y profesor que la creó)
  static async deleteGrade(req, res) {
    try {
      const { id } = req.params;

      // Para administradores, eliminar directamente
      // Para profesores, verificar que sean el autor de la calificación
      const profesorCedula = req.user.rol === 'administrador' ? null : req.user.cedula;
      
      const result = await Grade.delete(id, profesorCedula);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Error eliminando calificación:', error);

      if (error.message.includes('no encontrada') || error.message.includes('no encontrado')) {
        return res.status(404).json({
          error: 'NotFound',
          message: error.message
        });
      }

      if (error.message.includes('Solo el profesor')) {
        return res.status(403).json({
          error: 'Forbidden',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener promedio de un estudiante en un curso
  static async getStudentCourseAverage(req, res) {
    try {
      const { cedula, cursoId } = req.params;

      // Verificar permisos
      if (req.user.rol === 'estudiante' && req.user.cedula !== cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes ver tu propio promedio'
        });
      }

      // Verificar permisos para profesores
      if (req.user.rol === 'profesor') {
        const course = await Course.findById(cursoId);
        
        if (!course || course.docenteAsignado !== req.user.cedula) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Solo puedes ver promedios de tus cursos asignados'
          });
        }
      }

      const average = await Grade.calculateAverage(cedula, cursoId);

      res.json({
        success: true,
        average: average
      });

    } catch (error) {
      console.error('Error calculando promedio:', error);

      if (error.message.includes('no encontrad')) {
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

  // Obtener todas las calificaciones (solo admin) con filtros y paginación
  static async getAllGrades(req, res) {
    try {
      const {
        estudianteCedula,
        cursoId,
        profesorCedula,
        tipo,
        page = 1,
        limit = 20
      } = req.query;

      // Construir filtros
      const filters = {};
      if (estudianteCedula) filters.estudianteCedula = estudianteCedula;
      if (cursoId) filters.cursoId = cursoId;
      if (profesorCedula) filters.profesorCedula = profesorCedula;
      if (tipo) filters.tipo = tipo;

      const grades = await Grade.getDetailedReport(filters);

      // Paginación
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedGrades = grades.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedGrades,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(grades.length / limit),
          count: paginatedGrades.length,
          totalGrades: grades.length
        },
        filters: filters
      });

    } catch (error) {
      console.error('Error obteniendo todas las calificaciones:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Estadísticas de calificaciones
  static async getGradeStats(req, res) {
    try {
      const { cursoId, estudianteCedula } = req.query;

      // Construir filtros según el rol
      const filters = {};
      if (cursoId) filters.cursoId = cursoId;
      if (estudianteCedula) filters.estudianteCedula = estudianteCedula;

      // Si es profesor, solo estadísticas de sus cursos
      if (req.user.rol === 'profesor') {
        const teacherCourses = await Course.findAll({ docenteAsignado: req.user.cedula });
        if (cursoId) {
          // Verificar que el curso pertenece al profesor
          const courseExists = teacherCourses.some(c => c.id === cursoId);
          if (!courseExists) {
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Solo puedes ver estadísticas de tus cursos asignados'
            });
          }
        } else {
          // Si no especifica curso, usar todos sus cursos
          const teacherCourseIds = teacherCourses.map(c => c.id);
          filters.cursoIds = teacherCourseIds;
        }
      }

      const stats = await Grade.getStatistics();

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de calificaciones:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener resumen de notas de un estudiante (todas sus materias)
  static async getStudentReport(req, res) {
    try {
      const { cedula } = req.params;

      // Verificar permisos
      if (req.user.rol === 'estudiante' && req.user.cedula !== cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes ver tu propio reporte'
        });
      }

      // Obtener todas las inscripciones activas del estudiante
      const enrollments = await Enrollment.findByStudent(cedula, 'activo');
      
      if (enrollments.length === 0) {
        return res.json({
          success: true,
          message: 'El estudiante no tiene inscripciones activas',
          data: [],
          count: 0
        });
      }

      // Obtener calificaciones y promedios por curso
      const courseReports = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = await Course.findById(enrollment.cursoId);
          const grades = await Grade.findByStudent(cedula, { cursoId: enrollment.cursoId });
          const average = grades.length > 0 ? await Grade.calculateAverage(cedula, enrollment.cursoId) : null;

          return {
            curso: course ? {
              id: course.id,
              nombre: course.nombre,
              carrera: course.carrera,
              modalidad: course.modalidad
            } : null,
            calificaciones: grades,
            promedio: average,
            numeroCalificaciones: grades.length
          };
        })
      );

      res.json({
        success: true,
        data: courseReports,
        count: courseReports.length
      });

    } catch (error) {
      console.error('Error generando reporte del estudiante:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }
}

export default GradeController;