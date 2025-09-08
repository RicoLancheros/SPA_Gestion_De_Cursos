import { db } from '../config/firebase.js';

async function testFirebaseConnection() {
  try {
    console.log('🧪 Probando conexión con Firebase...');
    
    // Crear un documento de prueba
    const testData = {
      message: 'Firebase funciona correctamente!',
      timestamp: new Date(),
      test: true
    };
    
    // Escribir a Firestore
    const docRef = await db.collection('test').add(testData);
    console.log('✅ Documento escrito con ID:', docRef.id);
    
    // Leer desde Firestore
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('✅ Documento leído:', doc.data());
    }
    
    // Eliminar el documento de prueba
    await docRef.delete();
    console.log('✅ Documento de prueba eliminado');
    
    console.log('🎉 ¡Firebase funciona perfectamente!');
    return true;
    
  } catch (error) {
    console.error('❌ Error conectando con Firebase:', error.message);
    console.error('💡 Verifica las variables de entorno y credenciales');
    return false;
  }
}

// Exportar para uso en otros archivos
export default testFirebaseConnection;

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testFirebaseConnection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}