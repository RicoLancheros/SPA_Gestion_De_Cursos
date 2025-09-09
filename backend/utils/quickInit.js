import User from '../models/User.js';

async function quickInit() {
  try {
    console.log('🚀 Inicialización rápida...');

    // Crear administrador
    console.log('👤 Creando administrador...');
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
      console.log('⚠️  El administrador ya existe');
    } else {
      const admin = await User.create(adminData);
      console.log('✅ Administrador creado:', admin.nombre);
    }

    // Crear un profesor
    console.log('👨‍🏫 Creando profesor...');
    const teacherData = {
      cedula: '9876543210',
      nombre: 'María',
      apellido: 'García',
      email: 'maria.garcia@spa-gestion-cursos.com',
      telefono: '3009876543',
      password: 'profesor123',
      rol: 'profesor'
    };

    const existingTeacher = await User.findByCedula(teacherData.cedula);
    if (existingTeacher) {
      console.log('⚠️  El profesor ya existe');
    } else {
      const teacher = await User.create(teacherData);
      console.log('✅ Profesor creado:', teacher.nombre);
    }

    // Crear un estudiante
    console.log('🎓 Creando estudiante...');
    const studentData = {
      cedula: '1001001001',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@estudiante.com',
      telefono: '3101001001',
      password: 'estudiante123',
      rol: 'estudiante'
    };

    const existingStudent = await User.findByCedula(studentData.cedula);
    if (existingStudent) {
      console.log('⚠️  El estudiante ya existe');
    } else {
      const student = await User.create(studentData);
      console.log('✅ Estudiante creado:', student.nombre);
    }

    console.log('');
    console.log('🎉 Inicialización completada');
    console.log('🔐 CREDENCIALES:');
    console.log('Admin: 1234567890 / admin123');
    console.log('Profesor: 9876543210 / profesor123');
    console.log('Estudiante: 1001001001 / estudiante123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

quickInit()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));