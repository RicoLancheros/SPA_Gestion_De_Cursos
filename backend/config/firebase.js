import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar Firebase Admin solo si no está inicializado
if (!admin.apps.length) {
  try {
    // Intentar cargar desde archivo JSON primero (más fácil)
    const serviceAccountPath = join(__dirname, '../../spa-gestion-cursos-firebase-adminsdk-fbsvc-546ec5fa67.json');
    
    let serviceAccount;
    try {
      const serviceAccountFile = readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
      console.log('📄 Usando archivo JSON de credenciales');
    } catch (fileError) {
      // Si no existe el archivo, usar variables de entorno
      console.log('🔧 Usando variables de entorno para Firebase');
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('🔥 Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    console.error('💡 Verifica las credenciales de Firebase');
  }
}

// Exportar servicios de Firebase
export const db = admin.firestore();
export const auth = admin.auth();
export default admin;