import User from '../models/User.js';

async function testUserModel() {
  try {
    console.log('🧪 Probando modelo User...');
    
    // Crear usuario de prueba
    const testUser = {
      cedula: '1111111111',
      nombre: 'Test',
      apellido: 'Usuario',
      email: 'test@test.com',
      telefono: '3001111111',
      password: 'test123',
      rol: 'estudiante'
    };

    // Probar validación
    console.log('✅ Probando validación...');
    const validation = User.validate(testUser);
    console.log('Validación:', validation);

    if (validation.isValid) {
      console.log('✅ Probando creación de usuario...');
      const createdUser = await User.create(testUser);
      console.log('Usuario creado:', createdUser.nombre, createdUser.apellido);

      console.log('✅ Probando búsqueda por cédula...');
      const foundUser = await User.findByCedula(testUser.cedula);
      console.log('Usuario encontrado:', foundUser ? foundUser.nombre : 'No encontrado');

      console.log('✅ Probando búsqueda por email...');
      const foundByEmail = await User.findByEmail(testUser.email);
      console.log('Usuario por email:', foundByEmail ? foundByEmail.nombre : 'No encontrado');
    }

    console.log('🎉 Test del modelo User completado');

  } catch (error) {
    console.error('❌ Error en test del modelo User:', error.message);
  }
}

testUserModel()
  .then(() => {
    console.log('✅ Test completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error.message);
    process.exit(1);
  });