import Task from '../models/Task.js';
import Grade from '../models/Grade.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';

class TaskController {

  // Crear nueva tarea (profesores del curso y admin)
  static async createTask(req, res) {
    try {
      const {
        titulo,
        descripcion,
        cursoId,
        tipo,
        peso,
        fechaVencimiento,
        observaciones
      } = req.body;

      if (!titulo || !descripcion || !cursoId || !tipo) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Título, descripción, curso y tipo son requeridos'
        });
      }

      const taskData = {
        titulo,
        descripcion,
        cursoId,
        profesorCedula: req.user.cedula,
        tipo,
        peso: peso ? parseFloat(peso) : 1,
        fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
        observaciones: observaciones || null,
        estado: 'activa'
      };

      const newTask = await Task.create(taskData);

      // Obtener información adicional para la respuesta
      const course = await Course.findById(cursoId);

      res.status(201).json({
        success: true,
        message: 'Tarea creada exitosamente',
        task: {
          ...newTask,
          curso: course ? {
            nombre: course.nombre,
            carrera: course.carrera
          } : null
        }
      });

    } catch (error) {
      console.error('Error creando tarea:', error);

      if (error.message.includes('Datos inválidos') ||
          error.message.includes('Solo puedes crear tareas')) {
        return res.status(400).json({
          error: 'BadRequest',
          message: error.message
        });
      }

      if (error.message.includes('no existe') ||
          error.message.includes('no encontrado')) {
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

  // Obtener todas las tareas de un profesor
  static async getTeacherTasks(req, res) {
    try {
      const { cursoId, estado } = req.query;
      const profesorCedula = req.user.cedula;

      const tasks = await Task.findByTeacher(profesorCedula, cursoId, estado);

      // Enriquecer con información de cursos
      const enrichedTasks = await Promise.all(
        tasks.map(async (task) => {
          const course = await Course.findById(task.cursoId);

          return {
            ...task,
            curso: course ? {
              id: course.id,
              nombre: course.nombre,
              carrera: course.carrera
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedTasks,
        count: enrichedTasks.length,
        filters: { cursoId, estado }
      });

    } catch (error) {
      console.error('Error obteniendo tareas del profesor:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener tareas de un curso (profesores del curso y admin)
  static async getCourseTasks(req, res) {
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
            message: 'Solo puedes ver tareas de tus cursos asignados'
          });
        }
      }

      const tasks = await Task.findByCourse(cursoId, estado);

      // Enriquecer con información del profesor
      const enrichedTasks = await Promise.all(
        tasks.map(async (task) => {
          const teacher = await User.findByCedula(task.profesorCedula);

          return {
            ...task,
            profesor: teacher ? {
              nombre: teacher.nombre,
              apellido: teacher.apellido
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedTasks,
        count: enrichedTasks.length,
        filters: { cursoId, estado }
      });

    } catch (error) {
      console.error('Error obteniendo tareas del curso:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener tareas para estudiantes
  static async getStudentTasks(req, res) {
    try {
      const { cedula } = req.params;

      // Verificar permisos
      if (req.user.rol === 'estudiante' && req.user.cedula !== cedula) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Solo puedes ver tus propias tareas'
        });
      }

      const tasks = await Task.findByStudent(cedula);

      // Enriquecer con información de calificaciones
      const enrichedTasks = await Promise.all(
        tasks.map(async (task) => {
          const grade = await Grade.findByStudentAndTask(cedula, task.id);
          const teacher = await User.findByCedula(task.profesorCedula);

          return {
            ...task,
            calificacion: grade ? {
              nota: grade.nota,
              estado: grade.estado,
              fechaRegistro: grade.fechaRegistro,
              observaciones: grade.observaciones
            } : null,
            profesor: teacher ? {
              nombre: teacher.nombre,
              apellido: teacher.apellido
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedTasks,
        count: enrichedTasks.length
      });

    } catch (error) {
      console.error('Error obteniendo tareas del estudiante:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener una tarea específica con estudiantes del curso
  static async getTaskWithStudents(req, res) {
    try {
      const { taskId } = req.params;

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
          message: 'Solo puedes ver tus propias tareas'
        });
      }

      // Obtener estudiantes inscritos en el curso
      const enrollments = await Enrollment.findByCourse(task.cursoId, 'activo');
      
      // Obtener información completa de estudiantes con sus calificaciones
      const studentsWithGrades = await Promise.all(
        enrollments.map(async (enrollment) => {
          const student = await User.findByCedula(enrollment.estudianteCedula);
          const grade = await Grade.findByStudentAndTask(enrollment.estudianteCedula, taskId);

          return {
            cedula: student.cedula,
            nombre: student.nombre,
            apellido: student.apellido,
            email: student.email,
            calificacion: grade ? {
              id: grade.id,
              nota: grade.nota,
              estado: grade.estado,
              fechaRegistro: grade.fechaRegistro,
              observaciones: grade.observaciones
            } : null
          };
        })
      );

      // Obtener información del curso y profesor
      const course = await Course.findById(task.cursoId);
      const teacher = await User.findByCedula(task.profesorCedula);

      res.json({
        success: true,
        task: {
          ...task,
          curso: course ? {
            id: course.id,
            nombre: course.nombre,
            carrera: course.carrera
          } : null,
          profesor: teacher ? {
            nombre: teacher.nombre,
            apellido: teacher.apellido
          } : null
        },
        students: studentsWithGrades,
        stats: {
          totalStudents: studentsWithGrades.length,
          graded: studentsWithGrades.filter(s => s.calificacion).length,
          pending: studentsWithGrades.filter(s => !s.calificacion).length
        }
      });

    } catch (error) {
      console.error('Error obteniendo tarea con estudiantes:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar tarea
  static async updateTask(req, res) {
    try {
      const { taskId } = req.params;
      const updateData = req.body;

      // Verificar que hay algo que actualizar
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'No hay datos para actualizar'
        });
      }

      // Convertir datos si es necesario
      if (updateData.peso !== undefined) {
        updateData.peso = parseFloat(updateData.peso);
      }
      if (updateData.fechaVencimiento) {
        updateData.fechaVencimiento = new Date(updateData.fechaVencimiento);
      }

      const profesorCedula = req.user.rol === 'administrador' ? null : req.user.cedula;
      const updatedTask = await Task.update(taskId, updateData, profesorCedula);

      res.json({
        success: true,
        message: 'Tarea actualizada exitosamente',
        task: updatedTask
      });

    } catch (error) {
      console.error('Error actualizando tarea:', error);

      if (error.message.includes('no encontrada')) {
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

  // Eliminar tarea
  static async deleteTask(req, res) {
    try {
      const { taskId } = req.params;

      const profesorCedula = req.user.rol === 'administrador' ? null : req.user.cedula;
      const result = await Task.delete(taskId, profesorCedula);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('Error eliminando tarea:', error);

      if (error.message.includes('no encontrada')) {
        return res.status(404).json({
          error: 'NotFound',
          message: error.message
        });
      }

      if (error.message.includes('Solo el profesor') || 
          error.message.includes('tiene calificaciones asociadas')) {
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

  // Obtener todas las tareas (solo admin)
  static async getAllTasks(req, res) {
    try {
      const {
        cursoId,
        profesorCedula,
        tipo,
        estado,
        page = 1,
        limit = 20
      } = req.query;

      let tasks;
      
      if (cursoId) {
        tasks = await Task.findByCourse(cursoId, estado);
      } else if (profesorCedula) {
        tasks = await Task.findByTeacher(profesorCedula, null, estado);
      } else {
        // Obtener todas las tareas (solo admin)
        const snapshot = await Task.db?.collection('tasks').get();
        tasks = [];
        if (snapshot) {
          snapshot.forEach(doc => {
            tasks.push({ ...doc.data() });
          });
        }
      }

      // Filtrar por tipo si se especifica
      if (tipo) {
        tasks = tasks.filter(task => task.tipo === tipo);
      }

      // Paginación
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedTasks = tasks.slice(startIndex, endIndex);

      // Enriquecer con información adicional
      const enrichedTasks = await Promise.all(
        paginatedTasks.map(async (task) => {
          const course = await Course.findById(task.cursoId);
          const teacher = await User.findByCedula(task.profesorCedula);

          return {
            ...task,
            curso: course ? {
              id: course.id,
              nombre: course.nombre,
              carrera: course.carrera
            } : null,
            profesor: teacher ? {
              nombre: teacher.nombre,
              apellido: teacher.apellido
            } : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedTasks,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(tasks.length / limit),
          count: paginatedTasks.length,
          totalTasks: tasks.length
        },
        filters: { cursoId, profesorCedula, tipo, estado }
      });

    } catch (error) {
      console.error('Error obteniendo todas las tareas:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }

  // Estadísticas de tareas
  static async getTaskStats(req, res) {
    try {
      const { cursoId } = req.query;

      let stats;
      if (req.user.rol === 'profesor') {
        stats = await Task.getStats(req.user.cedula, cursoId);
      } else {
        stats = await Task.getStats(null, cursoId);
      }

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas de tareas:', error);
      res.status(500).json({
        error: 'InternalServerError',
        message: 'Error interno del servidor'
      });
    }
  }
}

export default TaskController;