import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Grade from '../models/Grade.js';

class DatabaseInitializer {
  
  // Crear usuario administrador por defecto
  static async createDefaultAdmin() {
    try {
      console.log('📋 Creando usuario administrador por defecto...');
      
      const adminData = {
        cedula: '1234567890',
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: 'admin@spa-gestion-cursos.com',
        telefono: '3001234567',
        password: 'admin123',
        rol: 'administrador'
      };

      // Verificar si ya existe
      const existingAdmin = await User.findByCedula(adminData.cedula);
      if (existingAdmin) {
        console.log('⚠️  El usuario administrador ya existe');
        return existingAdmin;
      }

      const admin = await User.create(adminData);
      console.log('✅ Usuario administrador creado:', admin.nombre, admin.apellido);
      return admin;

    } catch (error) {
      console.error('❌ Error creando administrador:', error.message);
      throw error;
    }
  }

  // Crear profesores de ejemplo
  static async createSampleTeachers() {
    try {
      console.log('👨‍🏫 Creando profesores de ejemplo...');
      
      const teachers = [
        {
          cedula: '9876543210',
          nombre: 'María',
          apellido: 'García',
          email: 'maria.garcia@spa-gestion-cursos.com',
          telefono: '3009876543',
          password: 'profesor123',
          rol: 'profesor'
        },
        {
          cedula: '1122334455',
          nombre: 'Carlos',
          apellido: 'Rodríguez',
          email: 'carlos.rodriguez@spa-gestion-cursos.com',
          telefono: '3001122334',
          password: 'profesor123',
          rol: 'profesor'
        },
        {
          cedula: '5544332211',
          nombre: 'Ana',
          apellido: 'López',
          email: 'ana.lopez@spa-gestion-cursos.com',
          telefono: '3005544332',
          password: 'profesor123',
          rol: 'profesor'
        }
      ];

      const createdTeachers = [];
      for (const teacherData of teachers) {
        try {
          // Verificar si ya existe
          const existingTeacher = await User.findByCedula(teacherData.cedula);
          if (existingTeacher) {
            console.log(`⚠️  El profesor ${teacherData.nombre} ${teacherData.apellido} ya existe`);
            createdTeachers.push(existingTeacher);
            continue;
          }

          const teacher = await User.create(teacherData);
          console.log(`✅ Profesor creado: ${teacher.nombre} ${teacher.apellido}`);
          createdTeachers.push(teacher);
        } catch (error) {
          console.error(`❌ Error creando profesor ${teacherData.nombre}:`, error.message);
        }
      }

      return createdTeachers;

    } catch (error) {
      console.error('❌ Error creando profesores:', error.message);
      throw error;
    }
  }

  // Crear estudiantes de ejemplo
  static async createSampleStudents() {
    try {
      console.log('🎓 Creando estudiantes de ejemplo...');
      
      const students = [
        {
          cedula: '1001001001',
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan.perez@estudiante.com',
          telefono: '3101001001',
          password: 'estudiante123',
          rol: 'estudiante'
        },
        {
          cedula: '2002002002',
          nombre: 'Laura',
          apellido: 'Martínez',
          email: 'laura.martinez@estudiante.com',
          telefono: '3102002002',
          password: 'estudiante123',
          rol: 'estudiante'
        },
        {
          cedula: '3003003003',
          nombre: 'Diego',
          apellido: 'Sánchez',
          email: 'diego.sanchez@estudiante.com',
          telefono: '3103003003',
          password: 'estudiante123',
          rol: 'estudiante'
        },
        {
          cedula: '4004004004',
          nombre: 'Sofia',
          apellido: 'Torres',
          email: 'sofia.torres@estudiante.com',
          telefono: '3104004004',
          password: 'estudiante123',
          rol: 'estudiante'
        }
      ];

      const createdStudents = [];
      for (const studentData of students) {
        try {
          // Verificar si ya existe
          const existingStudent = await User.findByCedula(studentData.cedula);
          if (existingStudent) {
            console.log(`⚠️  El estudiante ${studentData.nombre} ${studentData.apellido} ya existe`);
            createdStudents.push(existingStudent);
            continue;
          }

          const student = await User.create(studentData);
          console.log(`✅ Estudiante creado: ${student.nombre} ${student.apellido}`);
          createdStudents.push(student);
        } catch (error) {
          console.error(`❌ Error creando estudiante ${studentData.nombre}:`, error.message);
        }
      }

      return createdStudents;

    } catch (error) {
      console.error('❌ Error creando estudiantes:', error.message);
      throw error;
    }
  }

  // Crear cursos de ejemplo
  static async createSampleCourses(adminCedula, teachers) {
    try {
      console.log('📚 Creando cursos de ejemplo...');
      
      const courses = [
        {
          nombre: 'Desarrollo Web con React',
          descripcion: 'Aprende a crear aplicaciones web modernas con React y sus herramientas del ecosistema.',
          capacidadMaxima: 25,
          carrera: 'Tecnología en Sistemas',
          modalidad: 'virtual',
          horarios: [
            { dia: 'Lunes', horaInicio: '14:00', horaFin: '16:00' },
            { dia: 'Miércoles', horaInicio: '14:00', horaFin: '16:00' }
          ],
          salonOLink: 'https://meet.google.com/abc-defg-hij',
          duracionClase: 120,
          duracionTotal: 40,
          docenteAsignado: teachers[0]?.cedula || '9876543210',
          fechaInicio: new Date('2024-02-01'),
          fechaFin: new Date('2024-05-30'),
          creadoPor: adminCedula
        },
        {
          nombre: 'Base de Datos Avanzadas',
          descripcion: 'Diseño e implementación de bases de datos relacionales y no relacionales.',
          capacidadMaxima: 20,
          carrera: 'Tecnología en Sistemas',
          modalidad: 'presencial',
          horarios: [
            { dia: 'Martes', horaInicio: '08:00', horaFin: '10:00' },
            { dia: 'Jueves', horaInicio: '08:00', horaFin: '10:00' }
          ],
          salonOLink: 'Aula 201 - Edificio A',
          duracionClase: 120,
          duracionTotal: 48,
          docenteAsignado: teachers[1]?.cedula || '1122334455',
          fechaInicio: new Date('2024-02-05'),
          fechaFin: new Date('2024-06-15'),
          creadoPor: adminCedula
        },
        {
          nombre: 'Programación Móvil',
          descripcion: 'Desarrollo de aplicaciones móviles nativas e híbridas para Android e iOS.',
          capacidadMaxima: 15,
          carrera: 'Ingeniería de Sistemas',
          modalidad: 'mixta',
          horarios: [
            { dia: 'Viernes', horaInicio: '10:00', horaFin: '12:00' },
            { dia: 'Sábado', horaInicio: '08:00', horaFin: '10:00' }
          ],
          salonOLink: 'Aula 105 / https://zoom.us/xyz',
          duracionClase: 120,
          duracionTotal: 36,
          docenteAsignado: teachers[2]?.cedula || '5544332211',
          fechaInicio: new Date('2024-02-10'),
          fechaFin: new Date('2024-05-25'),
          creadoPor: adminCedula
        }
      ];

      const createdCourses = [];
      for (const courseData of courses) {
        try {
          const course = await Course.create(courseData);
          console.log(`✅ Curso creado: ${course.nombre}`);
          createdCourses.push(course);
        } catch (error) {
          console.error(`❌ Error creando curso ${courseData.nombre}:`, error.message);
        }
      }

      return createdCourses;

    } catch (error) {
      console.error('❌ Error creando cursos:', error.message);
      throw error;
    }
  }

  // Crear matrículas de ejemplo
  static async createSampleEnrollments(students, courses) {
    try {
      console.log('📝 Creando matrículas de ejemplo...');
      
      const enrollments = [];

      // Inscribir algunos estudiantes en diferentes cursos
      const enrollmentData = [
        { studentIndex: 0, courseIndex: 0 }, // Juan en React
        { studentIndex: 0, courseIndex: 1 }, // Juan en Base de Datos
        { studentIndex: 1, courseIndex: 0 }, // Laura en React
        { studentIndex: 1, courseIndex: 2 }, // Laura en Programación Móvil
        { studentIndex: 2, courseIndex: 1 }, // Diego en Base de Datos
        { studentIndex: 2, courseIndex: 2 }, // Diego en Programación Móvil
        { studentIndex: 3, courseIndex: 0 }, // Sofia en React
      ];

      for (const enrollData of enrollmentData) {
        try {
          const student = students[enrollData.studentIndex];
          const course = courses[enrollData.courseIndex];
          
          if (!student || !course) continue;

          const enrollment = await Enrollment.create({
            estudianteCedula: student.cedula,
            cursoId: course.id
          });

          console.log(`✅ Matrícula creada: ${student.nombre} en ${course.nombre}`);
          enrollments.push(enrollment);
        } catch (error) {
          console.error(`❌ Error creando matrícula:`, error.message);
        }
      }

      return enrollments;

    } catch (error) {
      console.error('❌ Error creando matrículas:', error.message);
      throw error;
    }
  }

  // Crear notas de ejemplo
  static async createSampleGrades(students, courses, teachers) {
    try {
      console.log('📊 Creando notas de ejemplo...');
      
      const grades = [];

      // Crear algunas notas para los estudiantes inscritos
      const gradeData = [
        {
          estudianteCedula: students[0]?.cedula, // Juan
          cursoId: courses[0]?.id, // React
          profesorCedula: teachers[0]?.cedula,
          nota: 4.2,
          tipo: 'parcial',
          descripcion: 'Primer parcial - Fundamentos de React',
          peso: 0.3
        },
        {
          estudianteCedula: students[0]?.cedula, // Juan
          cursoId: courses[0]?.id, // React
          profesorCedula: teachers[0]?.cedula,
          nota: 3.8,
          tipo: 'quiz',
          descripcion: 'Quiz - Hooks y Estado',
          peso: 0.2
        },
        {
          estudianteCedula: students[1]?.cedula, // Laura
          cursoId: courses[0]?.id, // React
          profesorCedula: teachers[0]?.cedula,
          nota: 4.5,
          tipo: 'parcial',
          descripcion: 'Primer parcial - Fundamentos de React',
          peso: 0.3
        },
        {
          estudianteCedula: students[1]?.cedula, // Laura
          cursoId: courses[2]?.id, // Programación Móvil
          profesorCedula: teachers[2]?.cedula,
          nota: 4.0,
          tipo: 'tarea',
          descripcion: 'Aplicación básica Android',
          peso: 0.25
        }
      ];

      for (const grade of gradeData) {
        try {
          if (!grade.estudianteCedula || !grade.cursoId || !grade.profesorCedula) continue;

          const createdGrade = await Grade.create(grade);
          console.log(`✅ Nota creada: ${grade.nota} para ${grade.descripcion}`);
          grades.push(createdGrade);
        } catch (error) {
          console.error(`❌ Error creando nota:`, error.message);
        }
      }

      return grades;

    } catch (error) {
      console.error('❌ Error creando notas:', error.message);
      throw error;
    }
  }

  // Función principal de inicialización
  static async initialize() {
    try {
      console.log('🚀 Iniciando configuración de base de datos...\n');

      // 1. Crear administrador
      const admin = await this.createDefaultAdmin();
      console.log('');

      // 2. Crear profesores
      const teachers = await this.createSampleTeachers();
      console.log('');

      // 3. Crear estudiantes
      const students = await this.createSampleStudents();
      console.log('');

      // 4. Crear cursos
      const courses = await this.createSampleCourses(admin.cedula, teachers);
      console.log('');

      // 5. Crear matrículas
      const enrollments = await this.createSampleEnrollments(students, courses);
      console.log('');

      // 6. Crear notas
      const grades = await this.createSampleGrades(students, courses, teachers);
      console.log('');

      // Resumen
      console.log('📋 RESUMEN DE INICIALIZACIÓN:');
      console.log('================================');
      console.log(`👤 Usuarios creados: ${1 + teachers.length + students.length}`);
      console.log(`   - Administradores: 1`);
      console.log(`   - Profesores: ${teachers.length}`);
      console.log(`   - Estudiantes: ${students.length}`);
      console.log(`📚 Cursos creados: ${courses.length}`);
      console.log(`📝 Matrículas creadas: ${enrollments.length}`);
      console.log(`📊 Notas creadas: ${grades.length}`);
      console.log('');
      console.log('✅ Base de datos inicializada correctamente');
      console.log('');
      console.log('🔐 CREDENCIALES DE ACCESO:');
      console.log('==========================');
      console.log('Administrador:');
      console.log('  Usuario: 1234567890');
      console.log('  Contraseña: admin123');
      console.log('');
      console.log('Profesores:');
      console.log('  Usuario: 9876543210, Contraseña: profesor123');
      console.log('  Usuario: 1122334455, Contraseña: profesor123');
      console.log('  Usuario: 5544332211, Contraseña: profesor123');
      console.log('');
      console.log('Estudiantes:');
      console.log('  Usuario: 1001001001, Contraseña: estudiante123');
      console.log('  Usuario: 2002002002, Contraseña: estudiante123');
      console.log('  Usuario: 3003003003, Contraseña: estudiante123');
      console.log('  Usuario: 4004004004, Contraseña: estudiante123');

      return {
        admin,
        teachers,
        students,
        courses,
        enrollments,
        grades
      };

    } catch (error) {
      console.error('❌ Error en inicialización de base de datos:', error.message);
      throw error;
    }
  }

  // Limpiar base de datos (para development/testing)
  static async cleanup() {
    try {
      console.log('🧹 Limpiando base de datos...');
      
      // Nota: En producción, nunca usar esta función
      // Solo para development y testing

      console.log('⚠️  Esta función solo debe usarse en desarrollo');
      console.log('❌ Funcionalidad de limpieza no implementada por seguridad');
      
    } catch (error) {
      console.error('❌ Error limpiando base de datos:', error.message);
      throw error;
    }
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  DatabaseInitializer.initialize()
    .then(() => {
      console.log('🎉 Proceso completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el proceso:', error.message);
      process.exit(1);
    });
}

export default DatabaseInitializer;