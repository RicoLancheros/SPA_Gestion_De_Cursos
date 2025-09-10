import { db } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

class Grade {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.estudianteCedula = data.estudianteCedula;
    this.cursoId = data.cursoId;
    this.taskId = data.taskId; // ID de la tarea asociada
    this.nota = data.nota;
    this.fechaRegistro = data.fechaRegistro || new Date();
    this.profesorCedula = data.profesorCedula; // quien registró la nota
    this.observaciones = data.observaciones || null;
    this.estado = data.estado || 'definitiva'; // 'provisional', 'definitiva'
  }

  // Validar datos de calificación
  static validate(gradeData) {
    const errors = [];

    // Validar cédula del estudiante (requerida)
    if (!gradeData.estudianteCedula || gradeData.estudianteCedula.trim() === '') {
      errors.push('La cédula del estudiante es requerida');
    }

    // Validar ID del curso (requerido)
    if (!gradeData.cursoId || gradeData.cursoId.trim() === '') {
      errors.push('El ID del curso es requerido');
    }

    // Validar ID de la tarea (requerido)
    if (!gradeData.taskId || gradeData.taskId.trim() === '') {
      errors.push('El ID de la tarea es requerido');
    }

    // Validar nota (requerida, debe estar entre 0 y 5)
    if (gradeData.nota === undefined || gradeData.nota === null) {
      errors.push('La nota es requerida');
    } else if (typeof gradeData.nota !== 'number' || gradeData.nota < 0 || gradeData.nota > 5) {
      errors.push('La nota debe ser un número entre 0 y 5');
    }

    // Validar cédula del profesor (requerida)
    if (!gradeData.profesorCedula || gradeData.profesorCedula.trim() === '') {
      errors.push('La cédula del profesor es requerida');
    }

    // Validar estado
    const estadosValidos = ['provisional', 'definitiva'];
    if (gradeData.estado && !estadosValidos.includes(gradeData.estado)) {
      errors.push('El estado debe ser: provisional o definitiva');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Crear nueva calificación
  static async create(gradeData) {
    try {
      // Validar datos
      const validation = Grade.validate(gradeData);
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      // Verificar que la tarea existe
      const Task = (await import('./Task.js')).default;
      const task = await Task.findById(gradeData.taskId);
      if (!task) {
        throw new Error('La tarea no existe');
      }

      // Verificar que el estudiante existe y tiene rol de estudiante
      const User = (await import('./User.js')).default;
      const estudiante = await User.findByCedula(gradeData.estudianteCedula);
      if (!estudiante) {
        throw new Error('El estudiante no existe');
      }
      if (estudiante.rol !== 'estudiante') {
        throw new Error('El usuario no tiene rol de estudiante');
      }

      // Verificar que el profesor existe y tiene rol de profesor
      const profesor = await User.findByCedula(gradeData.profesorCedula);
      if (!profesor) {
        throw new Error('El profesor no existe');
      }
      if (profesor.rol !== 'profesor' && profesor.rol !== 'administrador') {
        throw new Error('Solo profesores y administradores pueden calificar');
      }

      // Verificar que el curso existe y coincide con la tarea
      const Course = (await import('./Course.js')).default;
      const curso = await Course.findById(gradeData.cursoId);
      if (!curso) {
        throw new Error('El curso no existe');
      }

      if (task.cursoId !== gradeData.cursoId) {
        throw new Error('La tarea no pertenece al curso especificado');
      }

      // Verificar que el profesor puede calificar esta tarea (es suya o es admin)
      if (profesor.rol === 'profesor' && task.profesorCedula !== gradeData.profesorCedula) {
        throw new Error('Solo puedes calificar tareas que hayas creado');
      }

      // Verificar que el estudiante está inscrito en el curso
      const Enrollment = (await import('./Enrollment.js')).default;
      const enrollment = await Enrollment.findByStudentAndCourse(
        gradeData.estudianteCedula, 
        gradeData.cursoId
      );
      if (!enrollment || enrollment.estado !== 'activo') {
        throw new Error('El estudiante no está inscrito en este curso');
      }

      // Verificar que no existe ya una calificación para este estudiante en esta tarea
      const existingGrade = await Grade.findByStudentAndTask(
        gradeData.estudianteCedula,
        gradeData.taskId
      );
      if (existingGrade) {
        throw new Error('Ya existe una calificación para este estudiante en esta tarea');
      }

      // Crear objeto calificación
      const newGrade = new Grade({
        ...gradeData,
        fechaRegistro: new Date()
      });

      // Guardar en Firestore
      await db.collection('grades').doc(newGrade.id).set({
        id: newGrade.id,
        estudianteCedula: newGrade.estudianteCedula,
        cursoId: newGrade.cursoId,
        taskId: newGrade.taskId,
        nota: newGrade.nota,
        fechaRegistro: newGrade.fechaRegistro,
        profesorCedula: newGrade.profesorCedula,
        observaciones: newGrade.observaciones,
        estado: newGrade.estado
      });

      return newGrade;

    } catch (error) {
      throw new Error(`Error creando calificación: ${error.message}`);
    }
  }

  // Buscar calificación por ID
  static async findById(gradeId) {
    try {
      const doc = await db.collection('grades').doc(gradeId).get();
      if (doc.exists) {
        return { ...doc.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Error buscando calificación por ID: ${error.message}`);
    }
  }

  // Obtener todas las calificaciones de un estudiante
  static async findByStudent(estudianteCedula, cursoId = null) {
    try {
      let query = db.collection('grades')
        .where('estudianteCedula', '==', estudianteCedula);

      if (cursoId) {
        query = query.where('cursoId', '==', cursoId);
      }

      const snapshot = await query.orderBy('fechaRegistro', 'desc').get();
      const grades = [];

      snapshot.forEach(doc => {
        grades.push({ ...doc.data() });
      });

      return grades;
    } catch (error) {
      throw new Error(`Error obteniendo calificaciones del estudiante: ${error.message}`);
    }
  }

  // Obtener todas las calificaciones de una tarea
  static async findByTask(taskId) {
    try {
      const snapshot = await db.collection('grades')
        .where('taskId', '==', taskId)
        .orderBy('fechaRegistro', 'desc')
        .get();

      const grades = [];
      snapshot.forEach(doc => {
        grades.push({ ...doc.data() });
      });

      return grades;
    } catch (error) {
      throw new Error(`Error obteniendo calificaciones de la tarea: ${error.message}`);
    }
  }

  // Buscar calificación específica de un estudiante en una tarea
  static async findByStudentAndTask(estudianteCedula, taskId) {
    try {
      const snapshot = await db.collection('grades')
        .where('estudianteCedula', '==', estudianteCedula)
        .where('taskId', '==', taskId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { ...doc.data() };
      }

      return null;
    } catch (error) {
      throw new Error(`Error buscando calificación del estudiante en la tarea: ${error.message}`);
    }
  }

  // Obtener todas las calificaciones de un curso
  static async findByCourse(cursoId, tipo = null) {
    try {
      let query = db.collection('grades')
        .where('cursoId', '==', cursoId);

      if (tipo) {
        query = query.where('tipo', '==', tipo);
      }

      // Intentar con orderBy, si falla, obtener sin ordenar
      let snapshot;
      try {
        snapshot = await query.orderBy('fechaEvaluacion', 'desc').get();
      } catch (orderError) {
        console.warn('Error con orderBy, obteniendo sin ordenar:', orderError.message);
        snapshot = await query.get();
      }

      const grades = [];
      snapshot.forEach(doc => {
        grades.push({ ...doc.data() });
      });

      // Ordenar manualmente si no se pudo hacer en la consulta
      grades.sort((a, b) => {
        const dateA = a.fechaEvaluacion?.seconds ? new Date(a.fechaEvaluacion.seconds * 1000) : new Date(a.fechaEvaluacion);
        const dateB = b.fechaEvaluacion?.seconds ? new Date(b.fechaEvaluacion.seconds * 1000) : new Date(b.fechaEvaluacion);
        return dateB - dateA;
      });

      return grades;
    } catch (error) {
      throw new Error(`Error obteniendo calificaciones del curso: ${error.message}`);
    }
  }

  // Obtener calificaciones de un profesor
  static async findByTeacher(profesorCedula, cursoId = null) {
    try {
      let query = db.collection('grades')
        .where('profesorCedula', '==', profesorCedula);

      if (cursoId) {
        query = query.where('cursoId', '==', cursoId);
      }

      const snapshot = await query.orderBy('fechaRegistro', 'desc').get();
      const grades = [];

      snapshot.forEach(doc => {
        grades.push({ ...doc.data() });
      });

      return grades;
    } catch (error) {
      throw new Error(`Error obteniendo calificaciones del profesor: ${error.message}`);
    }
  }

  // Actualizar calificación
  static async update(gradeId, updateData, profesorCedula) {
    try {
      // Verificar que la calificación existe
      const existingGrade = await Grade.findById(gradeId);
      if (!existingGrade) {
        throw new Error('Calificación no encontrada');
      }

      // Verificar que el profesor que actualiza es el mismo que la creó
      if (existingGrade.profesorCedula !== profesorCedula) {
        throw new Error('Solo el profesor que registró la calificación puede actualizarla');
      }

      // Validar datos de actualización si incluyen campos críticos
      if (updateData.nota !== undefined) {
        if (typeof updateData.nota !== 'number' || updateData.nota < 0 || updateData.nota > 5) {
          throw new Error('La nota debe ser un número entre 0 y 5');
        }
      }

      // Actualizar en Firestore
      await db.collection('grades').doc(gradeId).update({
        ...updateData,
        fechaActualizacion: new Date()
      });

      // Retornar calificación actualizada
      return await Grade.findById(gradeId);

    } catch (error) {
      throw new Error(`Error actualizando calificación: ${error.message}`);
    }
  }

  // Eliminar calificación
  static async delete(gradeId, profesorCedula) {
    try {
      // Verificar que la calificación existe
      const existingGrade = await Grade.findById(gradeId);
      if (!existingGrade) {
        throw new Error('Calificación no encontrada');
      }

      // Verificar que el profesor que elimina es el mismo que la creó
      if (existingGrade.profesorCedula !== profesorCedula) {
        throw new Error('Solo el profesor que registró la calificación puede eliminarla');
      }

      // Eliminar de Firestore
      await db.collection('grades').doc(gradeId).delete();

      return { message: 'Calificación eliminada correctamente' };

    } catch (error) {
      throw new Error(`Error eliminando calificación: ${error.message}`);
    }
  }

  // Calcular promedio de un estudiante en un curso
  static async calculateAverage(estudianteCedula, cursoId) {
    try {
      const grades = await Grade.findByStudent(estudianteCedula, cursoId);
      
      if (grades.length === 0) {
        return null;
      }

      // Obtener información de las tareas para calcular el promedio ponderado
      const Task = (await import('./Task.js')).default;
      let totalNota = 0;
      let totalPeso = 0;

      for (const grade of grades) {
        if (grade.estado === 'definitiva') {
          const task = await Task.findById(grade.taskId);
          const peso = task ? task.peso : 1;
          
          totalNota += grade.nota * peso;
          totalPeso += peso;
        }
      }

      const promedio = totalPeso > 0 ? totalNota / totalPeso : 0;

      return {
        promedio: Math.round(promedio * 100) / 100, // Redondear a 2 decimales
        totalEvaluaciones: grades.filter(g => g.estado === 'definitiva').length,
        estado: promedio >= 3 ? 'aprobado' : 'reprobado'
      };

    } catch (error) {
      throw new Error(`Error calculando promedio: ${error.message}`);
    }
  }

  // Obtener reporte de calificaciones con información detallada
  static async getDetailedReport(filters = {}) {
    try {
      let query = db.collection('grades');

      // Aplicar filtros
      if (filters.cursoId) {
        query = query.where('cursoId', '==', filters.cursoId);
      }
      if (filters.estudianteCedula) {
        query = query.where('estudianteCedula', '==', filters.estudianteCedula);
      }
      if (filters.profesorCedula) {
        query = query.where('profesorCedula', '==', filters.profesorCedula);
      }
      if (filters.tipo) {
        query = query.where('tipo', '==', filters.tipo);
      }

      const snapshot = await query.orderBy('fechaEvaluacion', 'desc').get();
      const grades = [];

      snapshot.forEach(doc => {
        grades.push({ ...doc.data() });
      });

      // Enriquecer con información de estudiante, curso y profesor
      const User = (await import('./User.js')).default;
      const Course = (await import('./Course.js')).default;

      const detailedGrades = await Promise.all(
        grades.map(async (grade) => {
          const estudiante = await User.findByCedula(grade.estudianteCedula);
          const curso = await Course.findById(grade.cursoId);
          const profesor = await User.findByCedula(grade.profesorCedula);

          return {
            ...grade,
            estudiante: estudiante ? {
              cedula: estudiante.cedula,
              nombre: estudiante.nombre,
              apellido: estudiante.apellido
            } : null,
            curso: curso ? {
              id: curso.id,
              nombre: curso.nombre,
              carrera: curso.carrera
            } : null,
            profesor: profesor ? {
              cedula: profesor.cedula,
              nombre: profesor.nombre,
              apellido: profesor.apellido
            } : null
          };
        })
      );

      return detailedGrades;
    } catch (error) {
      throw new Error(`Error obteniendo reporte detallado: ${error.message}`);
    }
  }

  // Estadísticas de calificaciones
  static async getStatistics(cursoId = null) {
    try {
      let grades;
      if (cursoId) {
        grades = await Grade.findByCourse(cursoId);
      } else {
        const snapshot = await db.collection('grades').get();
        grades = [];
        snapshot.forEach(doc => {
          grades.push({ ...doc.data() });
        });
      }

      const stats = {
        totalGrades: grades.length,
        total: grades.length,
        porTipo: {
          parcial: grades.filter(g => g.tipo === 'parcial').length,
          final: grades.filter(g => g.tipo === 'final').length,
          quiz: grades.filter(g => g.tipo === 'quiz').length,
          tarea: grades.filter(g => g.tipo === 'tarea').length
        },
        promedioGeneral: 0,
        aprobados: 0,
        reprobados: 0,
        distribucionNotas: {
          '0-1': 0,
          '1-2': 0,
          '2-3': 0,
          '3-4': 0,
          '4-5': 0
        }
      };

      if (grades.length > 0) {
        const totalNotas = grades.reduce((sum, grade) => sum + grade.nota, 0);
        stats.promedioGeneral = Math.round((totalNotas / grades.length) * 100) / 100;

        grades.forEach(grade => {
          if (grade.nota >= 3) stats.aprobados++;
          else stats.reprobados++;

          // Distribución de notas
          if (grade.nota >= 0 && grade.nota < 1) stats.distribucionNotas['0-1']++;
          else if (grade.nota >= 1 && grade.nota < 2) stats.distribucionNotas['1-2']++;
          else if (grade.nota >= 2 && grade.nota < 3) stats.distribucionNotas['2-3']++;
          else if (grade.nota >= 3 && grade.nota < 4) stats.distribucionNotas['3-4']++;
          else if (grade.nota >= 4 && grade.nota <= 5) stats.distribucionNotas['4-5']++;
        });
      }

      return stats;
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }
}

export default Grade;