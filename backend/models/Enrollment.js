import { db } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

class Enrollment {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.estudianteCedula = data.estudianteCedula;
    this.cursoId = data.cursoId;
    this.fechaInscripcion = data.fechaInscripcion || new Date();
    this.estado = data.estado || 'activo'; // 'activo', 'retirado'
    this.fechaRetiro = data.fechaRetiro || null;
    this.motivoRetiro = data.motivoRetiro || null;
    this.puedeRetirarse = data.puedeRetirarse !== undefined ? data.puedeRetirarse : true;
  }

  // Validar datos de matrícula
  static validate(enrollmentData) {
    const errors = [];

    // Validar cédula del estudiante (requerida)
    if (!enrollmentData.estudianteCedula || enrollmentData.estudianteCedula.trim() === '') {
      errors.push('La cédula del estudiante es requerida');
    }

    // Validar ID del curso (requerido)
    if (!enrollmentData.cursoId || enrollmentData.cursoId.trim() === '') {
      errors.push('El ID del curso es requerido');
    }

    // Validar estado
    const estadosValidos = ['activo', 'retirado'];
    if (enrollmentData.estado && !estadosValidos.includes(enrollmentData.estado)) {
      errors.push('El estado especificado no es válido');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Verificar si puede retirarse (dentro de 24 horas)
  static canWithdraw(fechaInscripcion) {
    const now = new Date();
    const inscripcion = new Date(fechaInscripcion);
    const diffHours = Math.abs(now - inscripcion) / (1000 * 60 * 60);
    return diffHours <= 24;
  }

  // Crear nueva matrícula
  static async create(enrollmentData) {
    try {
      // Validar datos
      const validation = Enrollment.validate(enrollmentData);
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      // Verificar que el estudiante existe y tiene rol de estudiante
      const User = (await import('./User.js')).default;
      const estudiante = await User.findByCedula(enrollmentData.estudianteCedula);
      if (!estudiante) {
        throw new Error('El estudiante no existe');
      }
      if (estudiante.rol !== 'estudiante') {
        throw new Error('El usuario no tiene rol de estudiante');
      }

      // Verificar que el curso existe
      const Course = (await import('./Course.js')).default;
      const curso = await Course.findById(enrollmentData.cursoId);
      if (!curso) {
        throw new Error('El curso no existe');
      }

      // Verificar que el curso está en estado de inscripciones
      if (curso.estado !== 'inscripciones') {
        throw new Error('El curso no está disponible para inscripciones');
      }

      // Verificar que hay cupos disponibles
      if (curso.estudiantesInscritos >= curso.capacidadMaxima) {
        throw new Error('El curso ha alcanzado su capacidad máxima');
      }

      // Verificar que el estudiante no esté ya inscrito en el curso
      const existingEnrollment = await Enrollment.findByStudentAndCourse(
        enrollmentData.estudianteCedula, 
        enrollmentData.cursoId
      );
      if (existingEnrollment && existingEnrollment.estado === 'activo') {
        throw new Error('El estudiante ya está inscrito en este curso');
      }

      // NUEVA VALIDACIÓN: Verificar conflictos de horarios
      const scheduleConflicts = await Enrollment.checkScheduleConflicts(
        enrollmentData.estudianteCedula, 
        curso
      );
      if (scheduleConflicts.length > 0) {
        const conflictDetails = scheduleConflicts.map(conflict => 
          `${conflict.cursoNombre} (${conflict.dia} ${conflict.horaInicio}-${conflict.horaFin})`
        ).join(', ');
        throw new Error(`Conflicto de horarios detectado con: ${conflictDetails}`);
      }

      // Crear objeto matrícula
      const fechaInscripcion = new Date();
      const newEnrollment = new Enrollment({
        ...enrollmentData,
        fechaInscripcion: fechaInscripcion,
        estado: 'activo',
        puedeRetirarse: Enrollment.canWithdraw(fechaInscripcion)
      });

      // Guardar en Firestore
      await db.collection('enrollments').doc(newEnrollment.id).set({
        id: newEnrollment.id,
        estudianteCedula: newEnrollment.estudianteCedula,
        cursoId: newEnrollment.cursoId,
        fechaInscripcion: newEnrollment.fechaInscripcion,
        estado: newEnrollment.estado,
        fechaRetiro: null,
        motivoRetiro: null,
        puedeRetirarse: newEnrollment.puedeRetirarse
      });

      // Incrementar contador de estudiantes inscritos en el curso
      await Course.incrementEnrollment(enrollmentData.cursoId);

      return newEnrollment;

    } catch (error) {
      throw new Error(`Error creando matrícula: ${error.message}`);
    }
  }

  // Buscar matrícula por ID
  static async findById(enrollmentId) {
    try {
      const doc = await db.collection('enrollments').doc(enrollmentId).get();
      if (doc.exists) {
        return { ...doc.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Error buscando matrícula por ID: ${error.message}`);
    }
  }

  // Buscar matrícula por estudiante y curso
  static async findByStudentAndCourse(estudianteCedula, cursoId) {
    try {
      const snapshot = await db.collection('enrollments')
        .where('estudianteCedula', '==', estudianteCedula)
        .where('cursoId', '==', cursoId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { ...doc.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Error buscando matrícula: ${error.message}`);
    }
  }

  // Obtener todas las matrículas de un estudiante
  static async findByStudent(estudianteCedula, estado = null) {
    try {
      let query = db.collection('enrollments')
        .where('estudianteCedula', '==', estudianteCedula);

      if (estado) {
        query = query.where('estado', '==', estado);
      }

      const snapshot = await query.get();
      const enrollments = [];

      snapshot.forEach(doc => {
        const enrollment = { ...doc.data() };
        // Actualizar puedeRetirarse basado en la fecha actual
        if (enrollment.estado === 'activo') {
          enrollment.puedeRetirarse = Enrollment.canWithdraw(enrollment.fechaInscripcion.toDate());
        }
        enrollments.push(enrollment);
      });

      return enrollments;
    } catch (error) {
      throw new Error(`Error obteniendo matrículas del estudiante: ${error.message}`);
    }
  }

  // Obtener todas las matrículas de un curso
  static async findByCourse(cursoId, estado = null) {
    try {
      let query = db.collection('enrollments')
        .where('cursoId', '==', cursoId);

      if (estado) {
        query = query.where('estado', '==', estado);
      }

      const snapshot = await query.get();
      const enrollments = [];

      snapshot.forEach(doc => {
        enrollments.push({ ...doc.data() });
      });

      return enrollments;
    } catch (error) {
      throw new Error(`Error obteniendo matrículas del curso: ${error.message}`);
    }
  }

  // Obtener todas las matrículas (con filtros opcionales)
  static async findAll(filters = {}) {
    try {
      let query = db.collection('enrollments');

      // Aplicar filtros
      if (filters.estudianteCedula) {
        query = query.where('estudianteCedula', '==', filters.estudianteCedula);
      }
      if (filters.cursoId) {
        query = query.where('cursoId', '==', filters.cursoId);
      }
      if (filters.estado) {
        query = query.where('estado', '==', filters.estado);
      }

      const snapshot = await query.get();
      const enrollments = [];

      snapshot.forEach(doc => {
        enrollments.push({ ...doc.data() });
      });

      return enrollments;
    } catch (error) {
      throw new Error(`Error obteniendo matrículas: ${error.message}`);
    }
  }

  // Retirar estudiante de curso
  static async withdraw(enrollmentId, motivoRetiro = null) {
    try {
      // Verificar que la matrícula existe
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw new Error('Matrícula no encontrada');
      }

      // Verificar que está activa
      if (enrollment.estado !== 'activo') {
        throw new Error('La matrícula no está activa');
      }

      // Verificar que puede retirarse (dentro de 24 horas)
      if (!Enrollment.canWithdraw(enrollment.fechaInscripcion.toDate())) {
        throw new Error('Ya no es posible retirarse de este curso (han pasado más de 24 horas)');
      }

      // Actualizar en Firestore
      await db.collection('enrollments').doc(enrollmentId).update({
        estado: 'retirado',
        fechaRetiro: new Date(),
        motivoRetiro: motivoRetiro || 'Retiro voluntario'
      });

      // Decrementar contador de estudiantes inscritos en el curso
      const Course = (await import('./Course.js')).default;
      await Course.decrementEnrollment(enrollment.cursoId);

      return { message: 'Retiro exitoso' };

    } catch (error) {
      throw new Error(`Error retirando estudiante: ${error.message}`);
    }
  }

  // Reactivar matrícula (solo para administradores)
  static async reactivate(enrollmentId) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw new Error('Matrícula no encontrada');
      }

      if (enrollment.estado !== 'retirado') {
        throw new Error('La matrícula no está retirada');
      }

      // Verificar que el curso aún tiene cupos
      const Course = (await import('./Course.js')).default;
      const curso = await Course.findById(enrollment.cursoId);
      if (curso.estudiantesInscritos >= curso.capacidadMaxima) {
        throw new Error('El curso ha alcanzado su capacidad máxima');
      }

      // Reactivar matrícula
      await db.collection('enrollments').doc(enrollmentId).update({
        estado: 'activo',
        fechaRetiro: null,
        motivoRetiro: null
      });

      // Incrementar contador de estudiantes
      await Course.incrementEnrollment(enrollment.cursoId);

      return { message: 'Matrícula reactivada exitosamente' };

    } catch (error) {
      throw new Error(`Error reactivando matrícula: ${error.message}`);
    }
  }

  // Obtener matrículas con información detallada (incluye datos del estudiante y curso)
  static async findWithDetails(filters = {}) {
    try {
      const enrollments = await Enrollment.findAll(filters);
      const User = (await import('./User.js')).default;
      const Course = (await import('./Course.js')).default;

      const enrollmentsWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const estudiante = await User.findByCedula(enrollment.estudianteCedula);
          const curso = await Course.findById(enrollment.cursoId);

          return {
            ...enrollment,
            estudiante: estudiante ? {
              cedula: estudiante.cedula,
              nombre: estudiante.nombre,
              apellido: estudiante.apellido,
              email: estudiante.email
            } : null,
            curso: curso ? {
              id: curso.id,
              nombre: curso.nombre,
              carrera: curso.carrera,
              modalidad: curso.modalidad
            } : null
          };
        })
      );

      return enrollmentsWithDetails;
    } catch (error) {
      throw new Error(`Error obteniendo matrículas con detalles: ${error.message}`);
    }
  }

  // Estadísticas de matrículas
  static async getStatistics() {
    try {
      const allEnrollments = await Enrollment.findAll();
      
      const stats = {
        totalEnrollments: allEnrollments.length,
        activeEnrollments: allEnrollments.filter(e => e.estado === 'activo').length,
        withdrawnEnrollments: allEnrollments.filter(e => e.estado === 'retirado').length,
        total: allEnrollments.length,
        activas: allEnrollments.filter(e => e.estado === 'activo').length,
        retiradas: allEnrollments.filter(e => e.estado === 'retirado').length,
        porCurso: {},
        porMes: {}
      };

      // Estadísticas por curso
      allEnrollments.forEach(enrollment => {
        if (!stats.porCurso[enrollment.cursoId]) {
          stats.porCurso[enrollment.cursoId] = { total: 0, activas: 0, retiradas: 0 };
        }
        stats.porCurso[enrollment.cursoId].total++;
        stats.porCurso[enrollment.cursoId][enrollment.estado === 'activo' ? 'activas' : 'retiradas']++;
      });

      return stats;
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  // Verificar conflictos de horarios para un estudiante
  static async checkScheduleConflicts(estudianteCedula, nuevoCurso) {
    try {
      // Obtener todas las inscripciones activas del estudiante
      const activeEnrollments = await Enrollment.findByStudent(estudianteCedula, 'activo');
      
      if (!activeEnrollments || activeEnrollments.length === 0) {
        return []; // No hay inscripciones, no hay conflictos
      }

      const conflicts = [];
      const Course = (await import('./Course.js')).default;

      // Verificar cada inscripción activa
      for (const enrollment of activeEnrollments) {
        const enrolledCourse = await Course.findById(enrollment.cursoId);
        
        if (!enrolledCourse || !enrolledCourse.horarios || !nuevoCurso.horarios) {
          continue; // Skip si no hay horarios definidos
        }

        // Comparar horarios del nuevo curso con el curso ya inscrito
        for (const nuevoHorario of nuevoCurso.horarios) {
          if (!nuevoHorario.dia || !nuevoHorario.horaInicio || !nuevoHorario.horaFin) {
            continue; // Skip horarios incompletos
          }

          for (const horarioExistente of enrolledCourse.horarios) {
            if (!horarioExistente.dia || !horarioExistente.horaInicio || !horarioExistente.horaFin) {
              continue; // Skip horarios incompletos
            }

            // Verificar si es el mismo día
            if (nuevoHorario.dia.toLowerCase() === horarioExistente.dia.toLowerCase()) {
              
              // Convertir horarios a minutos para comparar
              const nuevoInicio = Enrollment.timeToMinutes(nuevoHorario.horaInicio);
              const nuevoFin = Enrollment.timeToMinutes(nuevoHorario.horaFin);
              const existenteInicio = Enrollment.timeToMinutes(horarioExistente.horaInicio);
              const existenteFin = Enrollment.timeToMinutes(horarioExistente.horaFin);

              // Verificar superposición de horarios
              // Hay conflicto si: (inicio1 < fin2) Y (inicio2 < fin1)
              if (nuevoInicio < existenteFin && existenteInicio < nuevoFin) {
                conflicts.push({
                  cursoId: enrolledCourse.id,
                  cursoNombre: enrolledCourse.nombre,
                  dia: horarioExistente.dia,
                  horaInicio: horarioExistente.horaInicio,
                  horaFin: horarioExistente.horaFin
                });
              }
            }
          }
        }
      }

      return conflicts;
    } catch (error) {
      throw new Error(`Error verificando conflictos de horarios: ${error.message}`);
    }
  }

  // Función auxiliar para convertir tiempo "HH:mm" a minutos
  static timeToMinutes(timeString) {
    if (!timeString || typeof timeString !== 'string') {
      return 0;
    }
    
    const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
    if (isNaN(hours) || isNaN(minutes)) {
      return 0;
    }
    
    return hours * 60 + minutes;
  }
}

export default Enrollment;