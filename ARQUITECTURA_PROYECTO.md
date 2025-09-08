# Arquitectura del Proyecto - SPA Gestión de Cursos

## 📋 Información General

**Tipo de Aplicación:** Single Page Application (SPA)
**Stack Tecnológico:**
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Base de Datos:** Firebase
- **Autenticación:** JWT
- **Arquitectura:** MVC (Model-View-Controller)

---

## 🏗️ Arquitectura del Sistema

### Frontend (React + Vite)
```
src/
├── components/           # Componentes reutilizables
│   ├── common/          # Componentes comunes (Header, Footer, etc.)
│   ├── forms/           # Formularios específicos
│   └── ui/              # Componentes de interfaz de usuario
├── pages/               # Páginas principales
│   ├── auth/            # Login, Register
│   ├── admin/           # Panel de coordinador/administrador
│   ├── teacher/         # Panel de profesores
│   └── student/         # Panel estudiantil
├── hooks/               # Custom hooks
├── services/            # Servicios para API calls
├── utils/               # Utilidades y helpers
├── context/             # Context API para estado global
├── guards/              # Protección de rutas
└── constants/           # Constantes de la aplicación
```

### Backend (Node.js + Express)
```
server/
├── controllers/         # Controladores MVC
│   ├── authController.js
│   ├── userController.js
│   ├── courseController.js
│   ├── enrollmentController.js
│   └── gradeController.js
├── models/              # Modelos de datos
│   ├── User.js
│   ├── Course.js
│   ├── Enrollment.js
│   └── Grade.js
├── routes/              # Definición de rutas
│   ├── auth.js
│   ├── users.js
│   ├── courses.js
│   ├── enrollments.js
│   └── grades.js
├── middleware/          # Middlewares personalizados
│   ├── auth.js          # Validación JWT
│   ├── validation.js    # Validación de datos
│   └── roleCheck.js     # Verificación de roles
├── config/              # Configuraciones
│   ├── firebase.js      # Configuración Firebase
│   └── database.js      # Configuración de BD
├── utils/               # Utilidades del servidor
└── app.js               # Configuración principal Express
```

---

## 👥 Roles de Usuario

### 🎓 Estudiante
- **Registro:** Pueden registrarse desde la aplicación (requiere email)
- **Identificador:** Cédula
- **Funcionalidades:**
  - Ver cursos disponibles
  - Buscar y filtrar cursos
  - Inscribirse a cursos
  - Salirse de cursos (solo 24h después de inscripción)
  - Ver sus inscripciones actuales
  - Ver sus notas por curso
  - Actualizar perfil personal

### 👨‍🏫 Profesor
- **Registro:** Solo desde base de datos directamente
- **Identificador:** Cédula
- **Funcionalidades:**
  - **Solo en cursos asignados a él:**
    - Editar información del curso (nombre, fechas, horarios, etc.)
    - Ver y gestionar estudiantes inscritos
    - Asignar y editar notas de estudiantes
    - Agregar contenido adicional al curso
    - Ver reportes del curso
  - **Restricciones:**
    - NO puede crear nuevos cursos
    - NO puede eliminar cursos
    - NO puede gestionar cursos de otros profesores
    - NO puede cambiar la asignación de profesores

### 👨‍💼 Administrador (Coordinador)
- **Registro:** Solo desde base de datos directamente
- **Identificador:** Cédula
- **Funcionalidades:**
  - **Gestión completa de cursos:**
    - Crear nuevos cursos
    - Editar cualquier curso
    - Eliminar cursos
    - Asignar/cambiar profesores a cursos
  - **Gestión de usuarios:**
    - Ver todos los usuarios (estudiantes y profesores)
    - Buscar usuarios (por cédula, nombre, email, teléfono)
    - Activar/desactivar usuarios
    - Gestionar roles de usuarios
  - **Gestión de matrículas:**
    - Ver todas las inscripciones
    - Inscribir/retirar estudiantes manualmente
    - Generar reportes de inscripciones
  - **Gestión de notas:**
    - Ver notas de todos los cursos
    - Generar reportes académicos
    - Exportar datos académicos

---

## 📊 Modelos de Datos

### Usuario (User)
```javascript
{
  cedula: String,          // Identificador único
  nombre: String,
  apellido: String,
  email: String,
  telefono: String,
  rol: String,             // 'estudiante' | 'profesor' | 'administrador'
  fechaRegistro: Date,
  estado: String           // 'activo' | 'inactivo'
}
```

### Curso (Course)
```javascript
{
  id: String,
  nombre: String,
  descripcion: String,
  capacidadMaxima: Number,
  carrera: String,
  modalidad: String,       // 'presencial' | 'virtual' | 'mixta'
  horarios: Array,
  salonOLink: String,
  duracionClase: Number,   // minutos
  duracionTotal: Number,   // horas
  docenteAsignado: String, // cédula del profesor
  estado: String,          // 'inscripciones' | 'iniciado' | 'finalizado' | 'cancelado'
  fechaCreacion: Date,
  fechaInicio: Date,
  fechaFin: Date
}
```

### Matrícula (Enrollment)
```javascript
{
  id: String,
  estudianteCedula: String,
  cursoId: String,
  fechaInscripcion: Date,
  estado: String,          // 'activo' | 'retirado'
  puedeRetirarse: Boolean, // true si han pasado menos de 24h
  fechaRetiro: Date        // fecha cuando se retiró (si aplica)
}
```

### Notas (Grade)
```javascript
{
  id: String,
  estudianteCedula: String,
  cursoId: String,
  nota: Number,            // calificación numérica
  tipo: String,           // 'parcial' | 'final' | 'quiz' | 'tarea'
  descripcion: String,    // descripción de la evaluación
  fechaEvaluacion: Date,
  fechaRegistro: Date,
  profesorCedula: String  // quien registró la nota
}
```

---

## 🛡️ Sistema de Autenticación

### JWT (JSON Web Tokens)
- **Generación:** Al iniciar sesión exitosamente
- **Contenido del Token:**
  ```javascript
  {
    cedula: String,
    rol: String,
    exp: Number,
    iat: Number
  }
  ```

### Middleware de Autenticación
1. **Verificar Token:** Validar JWT en rutas protegidas
2. **Verificar Rol:** Controlar acceso según rol de usuario
3. **Renovar Token:** Sistema de refresh tokens (opcional)

---

## 🛣️ Rutas y Endpoints

### Frontend Routes
```
/                        # Página de inicio
/login                   # Inicio de sesión
/register               # Registro (solo estudiantes)
/dashboard              # Dashboard según rol
/admin/
  ├── courses           # Gestión completa de cursos
  ├── teachers          # Gestión de profesores
  ├── students          # Gestión de estudiantes
  ├── enrollments       # Gestión de matrículas
  └── reports           # Reportes y estadísticas
/teacher/
  ├── my-courses        # Cursos asignados a mí
  ├── students          # Estudiantes de mis cursos
  ├── grades            # Gestión de notas
  └── profile           # Mi perfil
/student/
  ├── courses           # Ver cursos disponibles
  ├── my-courses        # Mis cursos inscritos
  ├── grades            # Mis notas
  └── profile           # Mi perfil
```

### API Endpoints
```
POST /api/auth/login          # Iniciar sesión
POST /api/auth/register       # Registro de estudiantes (requiere email)

GET  /api/users               # Listar usuarios (admin)
GET  /api/users/search        # Buscar usuarios (admin)
PUT  /api/users/:cedula       # Actualizar usuario
POST /api/users/teachers      # Crear profesor (admin)

GET  /api/courses             # Listar cursos
GET  /api/courses/my          # Mis cursos (profesor)
POST /api/courses             # Crear curso (admin)
PUT  /api/courses/:id         # Actualizar curso (admin/profesor asignado)
DELETE /api/courses/:id       # Eliminar curso (admin)
PUT  /api/courses/:id/assign  # Asignar profesor (admin)

POST /api/enrollments         # Inscribirse a curso
DELETE /api/enrollments/:id   # Salirse de curso (24h)
GET  /api/enrollments/my      # Mis inscripciones
GET  /api/enrollments/course/:id # Estudiantes de un curso

GET  /api/grades/student/:cedula # Notas de un estudiante
GET  /api/grades/course/:id   # Notas de un curso
POST /api/grades              # Registrar nota (profesor/admin)
PUT  /api/grades/:id          # Actualizar nota (profesor/admin)
DELETE /api/grades/:id        # Eliminar nota (profesor/admin)
```

---

## 🔒 Seguridad y Validaciones

### Validaciones Frontend
- Validación de formularios en tiempo real
- Sanitización de inputs
- Verificación de roles antes de renderizar componentes

### Validaciones Backend
- Validación de esquemas con librerías como Joi o Yup
- Sanitización de datos de entrada
- Verificación de permisos por rol
- Rate limiting en endpoints críticos

### Protección de Rutas
- Guards de autenticación
- Guards de autorización por rol
- Redirects automáticos según estado de auth

---

## 📱 Características Específicas

### Gestión de Inscripciones
- **Ventana de Retiro:** 24 horas desde inscripción
- **Validación de Capacidad:** No exceder límite máximo
- **Estados de Curso:** Control según estado actual
- **Registro con Email:** Obligatorio para estudiantes

### Sistema de Notas
- **Tipos de Evaluación:** Parcial, Final, Quiz, Tarea
- **Gestión por Profesor:** Solo en cursos asignados
- **Visualización Estudiante:** Acceso a sus propias notas
- **Reportes Administrativos:** Exportación de calificaciones

### Permisos por Rol
- **Estudiante:** 
  - Inscripción/retiro de cursos
  - Visualización de notas propias
  - Actualización de perfil
- **Profesor:**
  - Edición limitada a cursos asignados
  - Gestión de notas de sus estudiantes
  - NO creación/eliminación de cursos
- **Administrador:**
  - Control total del sistema
  - Asignación de profesores
  - Creación/eliminación de cursos y usuarios

### Búsquedas y Filtros
- **Estudiantes:** Por cédula, nombre, email, teléfono
- **Profesores:** Por cédula, nombre, cursos asignados
- **Cursos:** Por nombre, carrera, modalidad, estado, profesor
- **Notas:** Por estudiante, curso, tipo de evaluación
- **Paginación:** Para listas grandes de datos

### Estados del Sistema
- **Cursos:** En inscripciones → Iniciado → Finalizado/Cancelado
- **Usuarios:** Activo ↔ Inactivo
- **Matrículas:** Activo → Retirado
- **Notas:** Provisional → Definitiva

---

## 🚀 Tecnologías y Dependencias

### Frontend
- React 18+
- Vite
- React Router DOM
- Axios/Fetch para API calls
- Context API + useReducer
- CSS Modules o Styled Components

### Backend
- Express.js
- Firebase Admin SDK
- jsonwebtoken
- bcrypt (para hashing)
- cors
- helmet (seguridad)
- express-rate-limit

### Base de Datos (Firebase)
- Firestore para datos estructurados
- Firebase Authentication (opcional, complemento a JWT)
- Cloud Storage (para archivos futuros)

---

## 📈 Consideraciones de Escalabilidad

### Performance
- Paginación en listados grandes
- Lazy loading de componentes
- Caché en consultas frecuentes

### Mantenibilidad
- Separación clara de responsabilidades
- Componentes reutilizables
- Documentación de APIs
- Testing unitario e integración

### Futuras Extensiones
- Sistema de notificaciones por email/SMS
- Dashboard con estadísticas avanzadas
- Módulo de asistencia y seguimiento
- Sistema de evaluaciones en línea
- Integración con plataformas LMS
- Módulo de certificados digitales
- API para integración con sistemas académicos externos