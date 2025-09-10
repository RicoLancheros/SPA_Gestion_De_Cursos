import { db } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

class Task {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.titulo = data.titulo;
    this.descripcion = data.descripcion;
    this.cursoId = data.cursoId;
    this.profesorCedula = data.profesorCedula; // quien creó la tarea
    this.tipo = data.tipo; // 'parcial', 'final', 'quiz', 'tarea', 'proyecto'
    this.peso = data.peso || 1; // peso para el promedio final
    this.fechaCreacion = data.fechaCreacion || new Date();
    this.fechaVencimiento = data.fechaVencimiento;
    this.estado = data.estado || 'activa'; // 'activa', 'cerrada', 'borrador'
    this.observaciones = data.observaciones || null;
  }

  // Validar datos de tarea
  static validate(taskData) {
    const errors = [];

    // Validar título (requerido)
    if (!taskData.titulo || taskData.titulo.trim() === '') {
      errors.push('El título de la tarea es requerido');
    } else if (taskData.titulo.length > 100) {
      errors.push('El título no puede exceder 100 caracteres');
    }

    // Validar descripción (requerida)
    if (!taskData.descripcion || taskData.descripcion.trim() === '') {
      errors.push('La descripción de la tarea es requerida');
    } else if (taskData.descripcion.length > 500) {
      errors.push('La descripción no puede exceder 500 caracteres');
    }

    // Validar ID del curso (requerido)
    if (!taskData.cursoId || taskData.cursoId.trim() === '') {
      errors.push('El ID del curso es requerido');
    }

    // Validar cédula del profesor (requerida)
    if (!taskData.profesorCedula || taskData.profesorCedula.trim() === '') {
      errors.push('La cédula del profesor es requerida');
    }

    // Validar tipo de tarea
    const tiposValidos = ['parcial', 'final', 'quiz', 'tarea', 'proyecto'];
    if (!taskData.tipo || !tiposValidos.includes(taskData.tipo)) {
      errors.push('El tipo debe ser: parcial, final, quiz, tarea o proyecto');
    }

    // Validar peso (debe ser un número positivo)
    if (taskData.peso !== undefined && (typeof taskData.peso !== 'number' || taskData.peso <= 0)) {
      errors.push('El peso debe ser un número positivo');
    }

    // Validar fecha de vencimiento (si se proporciona, debe ser futura)
    if (taskData.fechaVencimiento) {
      const vencimiento = new Date(taskData.fechaVencimiento);
      if (isNaN(vencimiento.getTime())) {
        errors.push('La fecha de vencimiento no es válida');
      } else if (vencimiento <= new Date()) {
        errors.push('La fecha de vencimiento debe ser futura');
      }
    }

    // Validar estado
    const estadosValidos = ['activa', 'cerrada', 'borrador'];
    if (taskData.estado && !estadosValidos.includes(taskData.estado)) {
      errors.push('El estado debe ser: activa, cerrada o borrador');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Crear nueva tarea
  static async create(taskData) {
    try {
      // Validar datos
      const validation = Task.validate(taskData);
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      // Verificar que el profesor existe y tiene rol de profesor
      const User = (await import('./User.js')).default;
      const profesor = await User.findByCedula(taskData.profesorCedula);
      if (!profesor) {
        throw new Error('El profesor no existe');
      }
      if (profesor.rol !== 'profesor' && profesor.rol !== 'administrador') {
        throw new Error('Solo profesores y administradores pueden crear tareas');
      }

      // Verificar que el curso existe
      const Course = (await import('./Course.js')).default;
      const curso = await Course.findById(taskData.cursoId);
      if (!curso) {
        throw new Error('El curso no existe');
      }

      // Verificar que el profesor está asignado al curso (excepto admin)
      if (profesor.rol === 'profesor' && curso.docenteAsignado !== taskData.profesorCedula) {
        throw new Error('Solo puedes crear tareas para tus cursos asignados');
      }

      // Crear objeto tarea
      const newTask = new Task({
        ...taskData,
        fechaCreacion: new Date()
      });

      // Guardar en Firestore
      await db.collection('tasks').doc(newTask.id).set({
        id: newTask.id,
        titulo: newTask.titulo,
        descripcion: newTask.descripcion,
        cursoId: newTask.cursoId,
        profesorCedula: newTask.profesorCedula,
        tipo: newTask.tipo,
        peso: newTask.peso,
        fechaCreacion: newTask.fechaCreacion,
        fechaVencimiento: newTask.fechaVencimiento,
        estado: newTask.estado,
        observaciones: newTask.observaciones
      });

      return newTask;

    } catch (error) {
      throw new Error(`Error creando tarea: ${error.message}`);
    }
  }

  // Buscar tarea por ID
  static async findById(taskId) {
    try {
      const doc = await db.collection('tasks').doc(taskId).get();
      if (doc.exists) {
        return { ...doc.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Error buscando tarea por ID: ${error.message}`);
    }
  }

  // Obtener todas las tareas de un curso
  static async findByCourse(cursoId, estado = null) {
    try {
      let query = db.collection('tasks')
        .where('cursoId', '==', cursoId);

      if (estado) {
        query = query.where('estado', '==', estado);
      }

      const snapshot = await query.orderBy('fechaCreacion', 'desc').get();
      const tasks = [];

      snapshot.forEach(doc => {
        tasks.push({ ...doc.data() });
      });

      return tasks;
    } catch (error) {
      throw new Error(`Error obteniendo tareas del curso: ${error.message}`);
    }
  }

  // Obtener tareas de un profesor
  static async findByTeacher(profesorCedula, cursoId = null, estado = null) {
    try {
      let query = db.collection('tasks')
        .where('profesorCedula', '==', profesorCedula);

      if (cursoId) {
        query = query.where('cursoId', '==', cursoId);
      }

      if (estado) {
        query = query.where('estado', '==', estado);
      }

      const snapshot = await query.orderBy('fechaCreacion', 'desc').get();
      const tasks = [];

      snapshot.forEach(doc => {
        tasks.push({ ...doc.data() });
      });

      return tasks;
    } catch (error) {
      throw new Error(`Error obteniendo tareas del profesor: ${error.message}`);
    }
  }

  // Obtener tareas para un estudiante (basado en sus inscripciones)
  static async findByStudent(estudianteCedula) {
    try {
      // Obtener cursos en los que está inscrito el estudiante
      const Enrollment = (await import('./Enrollment.js')).default;
      const enrollments = await Enrollment.findByStudent(estudianteCedula, 'activo');

      if (enrollments.length === 0) {
        return [];
      }

      const courseIds = enrollments.map(e => e.cursoId);
      const tasks = [];

      // Obtener tareas activas de todos los cursos del estudiante
      for (const cursoId of courseIds) {
        const courseTasks = await Task.findByCourse(cursoId, 'activa');
        
        // Enriquecer con información del curso
        const Course = (await import('./Course.js')).default;
        const curso = await Course.findById(cursoId);

        courseTasks.forEach(task => {
          tasks.push({
            ...task,
            curso: curso ? {
              id: curso.id,
              nombre: curso.nombre,
              carrera: curso.carrera
            } : null
          });
        });
      }

      // Ordenar por fecha de creación (más recientes primero)
      tasks.sort((a, b) => {
        const dateA = a.fechaCreacion?.seconds ? new Date(a.fechaCreacion.seconds * 1000) : new Date(a.fechaCreacion);
        const dateB = b.fechaCreacion?.seconds ? new Date(b.fechaCreacion.seconds * 1000) : new Date(b.fechaCreacion);
        return dateB - dateA;
      });

      return tasks;
    } catch (error) {
      throw new Error(`Error obteniendo tareas del estudiante: ${error.message}`);
    }
  }

  // Actualizar tarea
  static async update(taskId, updateData, profesorCedula) {
    try {
      // Verificar que la tarea existe
      const existingTask = await Task.findById(taskId);
      if (!existingTask) {
        throw new Error('Tarea no encontrada');
      }

      // Verificar que el profesor que actualiza es el mismo que la creó (o es admin)
      if (profesorCedula && existingTask.profesorCedula !== profesorCedula) {
        const User = (await import('./User.js')).default;
        const user = await User.findByCedula(profesorCedula);
        if (!user || user.rol !== 'administrador') {
          throw new Error('Solo el profesor que creó la tarea puede actualizarla');
        }
      }

      // Validar datos de actualización
      if (updateData.titulo && updateData.titulo.trim() === '') {
        throw new Error('El título no puede estar vacío');
      }
      if (updateData.descripcion && updateData.descripcion.trim() === '') {
        throw new Error('La descripción no puede estar vacía');
      }

      // Actualizar en Firestore
      await db.collection('tasks').doc(taskId).update({
        ...updateData,
        fechaActualizacion: new Date()
      });

      // Retornar tarea actualizada
      return await Task.findById(taskId);

    } catch (error) {
      throw new Error(`Error actualizando tarea: ${error.message}`);
    }
  }

  // Eliminar tarea
  static async delete(taskId, profesorCedula) {
    try {
      // Verificar que la tarea existe
      const existingTask = await Task.findById(taskId);
      if (!existingTask) {
        throw new Error('Tarea no encontrada');
      }

      // Verificar que el profesor que elimina es el mismo que la creó (o es admin)
      if (profesorCedula && existingTask.profesorCedula !== profesorCedula) {
        const User = (await import('./User.js')).default;
        const user = await User.findByCedula(profesorCedula);
        if (!user || user.rol !== 'administrador') {
          throw new Error('Solo el profesor que creó la tarea puede eliminarla');
        }
      }

      // Verificar si la tarea tiene calificaciones asociadas
      const Grade = (await import('./Grade.js')).default;
      const grades = await Grade.findByTask(taskId);
      
      if (grades && grades.length > 0) {
        throw new Error('No se puede eliminar una tarea que tiene calificaciones asociadas');
      }

      // Eliminar de Firestore
      await db.collection('tasks').doc(taskId).delete();

      return { message: 'Tarea eliminada correctamente' };

    } catch (error) {
      throw new Error(`Error eliminando tarea: ${error.message}`);
    }
  }

  // Obtener estadísticas de tareas
  static async getStats(profesorCedula = null, cursoId = null) {
    try {
      let tasks;

      if (profesorCedula) {
        tasks = await Task.findByTeacher(profesorCedula, cursoId);
      } else if (cursoId) {
        tasks = await Task.findByCourse(cursoId);
      } else {
        // Solo admin puede obtener todas las estadísticas
        const snapshot = await db.collection('tasks').get();
        tasks = [];
        snapshot.forEach(doc => {
          tasks.push({ ...doc.data() });
        });
      }

      const stats = {
        totalTasks: tasks.length,
        porTipo: {
          parcial: tasks.filter(t => t.tipo === 'parcial').length,
          final: tasks.filter(t => t.tipo === 'final').length,
          quiz: tasks.filter(t => t.tipo === 'quiz').length,
          tarea: tasks.filter(t => t.tipo === 'tarea').length,
          proyecto: tasks.filter(t => t.tipo === 'proyecto').length
        },
        porEstado: {
          activa: tasks.filter(t => t.estado === 'activa').length,
          cerrada: tasks.filter(t => t.estado === 'cerrada').length,
          borrador: tasks.filter(t => t.estado === 'borrador').length
        },
        tareasRecientes: tasks.filter(t => {
          const creationDate = t.fechaCreacion?.seconds ? 
            new Date(t.fechaCreacion.seconds * 1000) : 
            new Date(t.fechaCreacion);
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return creationDate >= sevenDaysAgo;
        }).length
      };

      return stats;
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas de tareas: ${error.message}`);
    }
  }
}

export default Task;