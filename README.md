# SPA Gestión de Cursos

Sistema web para la gestión académica de cursos, estudiantes y profesores en instituciones educativas.

## Descripción

Plataforma web tipo SPA (Single Page Application) que permite administrar de manera integral los cursos educativos, matrículas de estudiantes y asignación de profesores. El sistema está diseñado para instituciones educativas que requieren un control detallado sobre la oferta académica y el seguimiento del rendimiento estudiantil.

## Finalidad

- Digitalizar completamente la gestión académica institucional
- Automatizar procesos de inscripción y seguimiento de estudiantes
- Centralizar la información de cursos, profesores y estudiantes
- Facilitar la comunicación entre diferentes roles del sistema
- Generar reportes y estadísticas académicas

## Stack Tecnológico

### Frontend
- **React 18+** - Librería de interfaz de usuario
- **Vite** - Herramienta de desarrollo y build
- **React Router DOM** - Navegación y enrutamiento
- **Axios** - Cliente HTTP para consumir APIs

### Backend
- **Node.js** - Entorno de ejecución JavaScript
- **Express.js** - Framework web para APIs REST
- **JWT** - Autenticación basada en tokens
- **Helmet** - Middlewares de seguridad
- **CORS** - Control de acceso entre dominios

### Base de Datos
- **Firebase Firestore** - Base de datos NoSQL en la nube
- **Firebase Admin SDK** - SDK para operaciones del servidor

### Seguridad
- **bcryptjs** - Encriptación de contraseñas
- **express-rate-limit** - Limitación de peticiones
- **dotenv** - Gestión de variables de entorno

## Funcionalidades Principales

### Roles de Usuario

**Estudiante:**
- Registro en la plataforma con email y cédula
- Visualización de cursos disponibles
- Inscripción y retiro de cursos (24h después de inscripción)
- Consulta de notas y progreso académico
- Actualización de perfil personal

**Profesor:**
- Gestión de cursos asignados (edición de información)
- Administración de estudiantes inscritos en sus cursos
- Registro y edición de notas de evaluaciones
- Generación de reportes de sus cursos

**Administrador:**
- Creación y gestión completa de cursos
- Asignación de profesores a cursos
- Administración de usuarios del sistema
- Gestión de matrículas y inscripciones
- Generación de reportes institucionales
- Búsqueda avanzada de usuarios

### Sistema de Cursos
- Información detallada: nombre, descripción, capacidad, carrera
- Modalidades: presencial, virtual, mixta
- Gestión de horarios y ubicaciones
- Control de estados: inscripciones, iniciado, finalizado, cancelado
- Seguimiento de duración de clases y curso total

### Sistema de Notas
- Tipos de evaluación: parcial, final, quiz, tarea
- Registro por parte de profesores asignados
- Consulta por estudiantes de sus propias calificaciones
- Reportes académicos para administradores

## Manual de Usuario

### Instalación y Configuración

1. **Clonar el repositorio:**
```bash
git clone [url-del-repositorio]
cd SPA_Gestion_De_Cursos
```

2. **Configurar el backend:**
```bash
cd backend
npm install
```

3. **Configurar el frontend:**
```bash
cd frontend
npm install
```

4. **Configurar variables de entorno:**
- Crear archivo `.env` en la carpeta `backend` con las variables de Firebase
- Crear archivo `.env` en la carpeta `frontend` con las variables de Firebase
- Configurar el archivo JSON de credenciales de Firebase en la raíz del proyecto

### Ejecución

1. **Iniciar el servidor backend:**
```bash
cd backend
npm run dev
```
Servidor disponible en: http://localhost:5000

2. **Iniciar la aplicación frontend:**
```bash
cd frontend
npm run dev
```
Aplicación disponible en: http://localhost:5173

### Uso del Sistema

**Para Estudiantes:**
1. Registrarse con cédula y email en la página principal
2. Iniciar sesión con credenciales
3. Explorar cursos disponibles usando filtros
4. Inscribirse a cursos de interés
5. Consultar notas en la sección correspondiente
6. Retirarse de cursos dentro del plazo de 24 horas

**Para Profesores:**
1. Iniciar sesión con credenciales proporcionadas
2. Acceder al panel de cursos asignados
3. Gestionar información de los cursos
4. Registrar notas de estudiantes
5. Generar reportes de progreso

**Para Administradores:**
1. Iniciar sesión con credenciales de administrador
2. Crear nuevos cursos y asignar profesores
3. Gestionar usuarios del sistema
4. Supervisar matrículas e inscripciones
5. Generar reportes institucionales
6. Administrar el sistema completo

### Endpoints API Principales

- `GET /api/health` - Verificar estado del servidor
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registro de estudiantes
- `GET /api/courses` - Listar cursos
- `POST /api/enrollments` - Inscribirse a curso
- `GET /api/grades` - Consultar notas

## Estructura del Proyecto

```
SPA_Gestion_De_Cursos/
├── backend/          # Servidor API REST
├── frontend/         # Aplicación web React
├── ARQUITECTURA_PROYECTO.md
├── CONFIGURACION_COMPLETADA.md
└── README.md
```

## Consideraciones de Seguridad

- Las credenciales de Firebase nunca deben subirse al repositorio
- Todas las variables sensibles están en archivos .env
- El sistema implementa middlewares de seguridad estándar
- La autenticación se maneja mediante tokens JWT
- Las rutas están protegidas según el rol del usuario

## Desarrollo

El proyecto sigue una arquitectura MVC (Model-View-Controller) con separación clara entre frontend y backend. La comunicación se realiza a través de una API REST con autenticación JWT y almacenamiento en Firebase Firestore.