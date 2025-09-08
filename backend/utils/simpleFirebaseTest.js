import { db } from '../config/firebase.js';

console.log('🧪 Probando conexión simple con Firebase...');

try {
  // Solo verificar que podemos acceder a Firestore
  const collections = await db.listCollections();
  console.log('✅ Conexión exitosa con Firestore');
  console.log(`📁 Encontradas ${collections.length} colecciones`);
  
  // Crear un documento simple de prueba
  const testRef = db.collection('test').doc('conexion-test');
  await testRef.set({
    mensaje: 'Firebase funciona correctamente!',
    timestamp: new Date().toISOString(),
    version: 'v1.0'
  });
  console.log('✅ Documento de prueba creado');
  
  // Leer el documento
  const doc = await testRef.get();
  if (doc.exists) {
    console.log('✅ Documento leído:', doc.data().mensaje);
  }
  
  // Limpiar - eliminar el documento de prueba
  await testRef.delete();
  console.log('✅ Documento de prueba eliminado');
  
  console.log('🎉 ¡Firebase configurado correctamente!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

process.exit(0);