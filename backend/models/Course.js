import { db } from '../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

class Course {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.nombre = data.nombre;
    this.descripcion = data.descripcion;
    this.capacidadMaxima = data.capacidadMaxima;
    this.carrera = data.carrera;
    this.modalidad = data.modalidad; // 'presencial', 'virtual', 'mixta'
    this.horarios = data.horarios || [];
    this.salonOLink = data.salonOLink;
    this.duracionClase = data.duracionClase; // en minutos
    this.duracionTotal = data.duracionTotal; // en horas
    this.docenteAsignado = data.docenteAsignado; // cédula del profesor
    this.estado = data.estado || 'inscripciones'; // 'inscripciones', 'iniciado', 'finalizado', 'cancelado'
    this.fechaCreacion = data.fechaCreacion || new Date();
    this.fechaInicio = data.fechaInicio;
    this.fechaFin = data.fechaFin;
    this.creadoPor = data.creadoPor; // cédula del administrador que lo creó
    this.estudiantesInscritos = data.estudiantesInscritos || 0;
    this.objetivos = data.objetivos || '';
  }

  // Validar datos del curso
  static validate(courseData) {
    const errors = [];

    // Validar nombre (requerido)
    if (!courseData.nombre || courseData.nombre.trim() === '') {
      errors.push('El nombre del curso es requerido');
    } else if (courseData.nombre.trim().length < 3) {
      errors.push('El nombre del curso debe tener al menos 3 caracteres');
    }

    // Validar descripción (requerida)
    if (!courseData.descripcion || courseData.descripcion.trim() === '') {
      errors.push('La descripción del curso es requerida');
    } else if (courseData.descripcion.trim().length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    }

    // Validar capacidad máxima (requerida, número positivo)
    if (!courseData.capacidadMaxima) {
      errors.push('La capacidad máxima es requerida');
    } else if (!Number.isInteger(courseData.capacidadMaxima) || courseData.capacidadMaxima <= 0) {
      errors.push('La capacidad máxima debe ser un número entero positivo');
    } else if (courseData.capacidadMaxima > 100) {
      errors.push('La capacidad máxima no puede exceder 100 estudiantes');
    }

    // Validar carrera (requerida)
    if (!courseData.carrera || courseData.carrera.trim() === '') {
      errors.push('La carrera es requerida');
    }

    // Validar modalidad
    const modalidadesValidas = ['presencial', 'virtual', 'mixta'];
    if (!courseData.modalidad || !modalidadesValidas.includes(courseData.modalidad)) {
      errors.push('La modalidad debe ser: presencial, virtual o mixta');
    }

    // Validar salón o link (requerido)
    if (!courseData.salonOLink || courseData.salonOLink.trim() === '') {
      errors.push('El salón o link virtual es requerido');
    }

    // Validar duración de clase (requerida, número positivo)
    if (!courseData.duracionClase) {
      errors.push('La duración de clase es requerida');
    } else if (!Number.isInteger(courseData.duracionClase) || courseData.duracionClase <= 0) {
      errors.push('La duración de clase debe ser un número entero positivo (minutos)');
    }

    // Validar duración total (requerida, número positivo)
    if (!courseData.duracionTotal) {
      errors.push('La duración total del curso es requerida');
    } else if (courseData.duracionTotal <= 0) {
      errors.push('La duración total debe ser un número positivo (horas)');
    }

    // Validar docente asignado (requerido)
    if (!courseData.docenteAsignado || courseData.docenteAsignado.trim() === '') {
      errors.push('El docente asignado es requerido');
    }

    // Validar fechas si se proporcionan
    if (courseData.fechaInicio && courseData.fechaFin) {
      const inicio = new Date(courseData.fechaInicio);
      const fin = new Date(courseData.fechaFin);
      
      if (inicio >= fin) {
        errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
      }
      
      if (inicio < new Date()) {
        errors.push('La fecha de inicio no puede ser en el pasado');
      }
    }

    // Validar estado
    const estadosValidos = ['inscripciones', 'iniciado', 'finalizado', 'cancelado'];
    if (courseData.estado && !estadosValidos.includes(courseData.estado)) {
      errors.push('El estado especificado no es válido');
    }

    // Validar horarios si se proporcionan
    if (courseData.horarios && Array.isArray(courseData.horarios)) {
      courseData.horarios.forEach((horario, index) => {
        if (!horario.dia || !horario.horaInicio || !horario.horaFin) {
          errors.push(`El horario ${index + 1} debe incluir día, hora de inicio y hora de fin`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Crear nuevo curso
  static async create(courseData) {
    try {
      // Validar datos
      const validation = Course.validate(courseData);
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      // Verificar que el docente existe y tiene rol de profesor
      const User = (await import('./User.js')).default;
      const docente = await User.findByCedula(courseData.docenteAsignado);
      if (!docente) {
        throw new Error('El docente asignado no existe');
      }
      if (docente.rol !== 'profesor') {
        throw new Error('El usuario asignado no tiene rol de profesor');
      }

      // Crear objeto curso
      const newCourse = new Course({
        ...courseData,
        fechaCreacion: new Date(),
        estudiantesInscritos: 0
      });

      // Guardar en Firestore
      await db.collection('courses').doc(newCourse.id).set({
        id: newCourse.id,
        nombre: newCourse.nombre,
        descripcion: newCourse.descripcion,
        capacidadMaxima: newCourse.capacidadMaxima,
        carrera: newCourse.carrera,
        modalidad: newCourse.modalidad,
        horarios: newCourse.horarios,
        salonOLink: newCourse.salonOLink,
        duracionClase: newCourse.duracionClase,
        duracionTotal: newCourse.duracionTotal,
        docenteAsignado: newCourse.docenteAsignado,
        estado: newCourse.estado,
        fechaCreacion: newCourse.fechaCreacion,
        fechaInicio: newCourse.fechaInicio || null,
        fechaFin: newCourse.fechaFin || null,
        creadoPor: newCourse.creadoPor,
        estudiantesInscritos: newCourse.estudiantesInscritos,
        objetivos: newCourse.objetivos
      });

      return newCourse;

    } catch (error) {
      throw new Error(`Error creando curso: ${error.message}`);
    }
  }

  // Buscar curso por ID
  static async findById(courseId) {
    try {
      const doc = await db.collection('courses').doc(courseId).get();
      if (doc.exists) {
        return { ...doc.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Error buscando curso por ID: ${error.message}`);
    }
  }

  // Obtener todos los cursos (con filtros opcionales)
  static async findAll(filters = {}) {
    try {
      let query = db.collection('courses');

      // Aplicar filtros
      if (filters.estado) {
        query = query.where('estado', '==', filters.estado);
      }
      if (filters.carrera) {
        query = query.where('carrera', '==', filters.carrera);
      }
      if (filters.modalidad) {
        query = query.where('modalidad', '==', filters.modalidad);
      }
      if (filters.docenteAsignado) {
        query = query.where('docenteAsignado', '==', filters.docenteAsignado);
      }

      const snapshot = await query.get();
      const courses = [];

      snapshot.forEach(doc => {
        courses.push({ ...doc.data() });
      });

      return courses;
    } catch (error) {
      throw new Error(`Error obteniendo cursos: ${error.message}`);
    }
  }

  // Obtener cursos disponibles para inscripción
  static async findAvailable() {
    try {
      const snapshot = await db.collection('courses')
        .where('estado', '==', 'inscripciones')
        .get();

      const availableCourses = [];

      snapshot.forEach(doc => {
        const course = { ...doc.data() };
        // Solo incluir cursos que tengan cupos disponibles
        if (course.estudiantesInscritos < course.capacidadMaxima) {
          availableCourses.push(course);
        }
      });

      return availableCourses;
    } catch (error) {
      throw new Error(`Error obteniendo cursos disponibles: ${error.message}`);
    }
  }

  // Actualizar curso
  static async update(courseId, updateData) {
    try {
      // Verificar que el curso existe
      const existingCourse = await Course.findById(courseId);
      if (!existingCourse) {
        throw new Error('Curso no encontrado');
      }

      // Si se cambia el docente, verificar que existe y es profesor
      if (updateData.docenteAsignado && updateData.docenteAsignado !== existingCourse.docenteAsignado) {
        const User = (await import('./User.js')).default;
        const docente = await User.findByCedula(updateData.docenteAsignado);
        if (!docente) {
          throw new Error('El nuevo docente asignado no existe');
        }
        if (docente.rol !== 'profesor') {
          throw new Error('El usuario asignado no tiene rol de profesor');
        }
      }

      // Actualizar en Firestore
      await db.collection('courses').doc(courseId).update({
        ...updateData,
        fechaActualizacion: new Date()
      });

      // Retornar curso actualizado
      return await Course.findById(courseId);

    } catch (error) {
      throw new Error(`Error actualizando curso: ${error.message}`);
    }
  }

  // Eliminar curso (cambiar estado a cancelado)
  static async delete(courseId) {
    try {
      await Course.update(courseId, { estado: 'cancelado' });
      return { message: 'Curso cancelado correctamente' };
    } catch (error) {
      throw new Error(`Error eliminando curso: ${error.message}`);
    }
  }

  // Incrementar contador de estudiantes inscritos
  static async incrementEnrollment(courseId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Curso no encontrado');
      }

      if (course.estudiantesInscritos >= course.capacidadMaxima) {
        throw new Error('El curso ha alcanzado su capacidad máxima');
      }

      await db.collection('courses').doc(courseId).update({
        estudiantesInscritos: course.estudiantesInscritos + 1
      });

      return true;
    } catch (error) {
      throw new Error(`Error incrementando inscripciones: ${error.message}`);
    }
  }

  // Decrementar contador de estudiantes inscritos
  static async decrementEnrollment(courseId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Curso no encontrado');
      }

      if (course.estudiantesInscritos > 0) {
        await db.collection('courses').doc(courseId).update({
          estudiantesInscritos: course.estudiantesInscritos - 1
        });
      }

      return true;
    } catch (error) {
      throw new Error(`Error decrementando inscripciones: ${error.message}`);
    }
  }

  // Buscar cursos por nombre o descripción
  static async search(searchTerm, filters = {}) {
    try {
      const courses = await Course.findAll(filters);
      
      if (!searchTerm || searchTerm.trim() === '') {
        return courses;
      }

      const term = searchTerm.toLowerCase();
      return courses.filter(course => 
        course.nombre.toLowerCase().includes(term) ||
        course.descripcion.toLowerCase().includes(term) ||
        course.carrera.toLowerCase().includes(term)
      );
    } catch (error) {
      throw new Error(`Error en búsqueda de cursos: ${error.message}`);
    }
  }

  // Verificar si un curso tiene cupos disponibles
  static async hasAvailableSpots(courseId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return false;
      }
      return course.estudiantesInscritos < course.capacidadMaxima;
    } catch (error) {
      throw new Error(`Error verificando cupos disponibles: ${error.message}`);
    }
  }
}

export default Course;