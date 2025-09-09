import { db } from '../config/firebase.js';
import bcrypt from 'bcryptjs';

class User {
  constructor(data) {
    this.cedula = data.cedula;
    this.nombre = data.nombre;
    this.apellido = data.apellido;
    this.email = data.email;
    this.telefono = data.telefono;
    this.password = data.password;
    this.rol = data.rol || 'estudiante'; // 'estudiante', 'profesor', 'administrador'
    this.fechaRegistro = data.fechaRegistro || new Date();
    this.estado = data.estado || 'activo'; // 'activo', 'inactivo'
    this.fechaUltimoAcceso = data.fechaUltimoAcceso || null;
  }

  // Validar datos del usuario
  static validate(userData) {
    const errors = [];

    // Validar cédula (requerida, única)
    if (!userData.cedula || userData.cedula.trim() === '') {
      errors.push('La cédula es requerida');
    } else if (!/^\d{8,10}$/.test(userData.cedula)) {
      errors.push('La cédula debe contener entre 8 y 10 dígitos');
    }

    // Validar nombre (requerido)
    if (!userData.nombre || userData.nombre.trim() === '') {
      errors.push('El nombre es requerido');
    } else if (userData.nombre.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres');
    }

    // Validar apellido (requerido)
    if (!userData.apellido || userData.apellido.trim() === '') {
      errors.push('El apellido es requerido');
    } else if (userData.apellido.trim().length < 2) {
      errors.push('El apellido debe tener al menos 2 caracteres');
    }

    // Validar email (requerido, formato)
    if (!userData.email || userData.email.trim() === '') {
      errors.push('El email es requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('El formato del email no es válido');
    }

    // Validar teléfono (opcional, pero si se proporciona debe ser válido)
    if (userData.telefono && !/^\d{10}$/.test(userData.telefono)) {
      errors.push('El teléfono debe contener 10 dígitos');
    }

    // Validar password (requerida para nuevos usuarios)
    if (!userData.password || userData.password.trim() === '') {
      errors.push('La contraseña es requerida');
    } else if (userData.password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }

    // Validar rol
    const rolesValidos = ['estudiante', 'profesor', 'administrador'];
    if (userData.rol && !rolesValidos.includes(userData.rol)) {
      errors.push('El rol especificado no es válido');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Encriptar contraseña
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verificar contraseña
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Crear nuevo usuario
  static async create(userData) {
    try {
      // Validar datos
      const validation = User.validate(userData);
      if (!validation.isValid) {
        throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
      }

      // Verificar que no exista usuario con misma cédula
      const existingUser = await User.findByCedula(userData.cedula);
      if (existingUser) {
        throw new Error('Ya existe un usuario con esta cédula');
      }

      // Verificar que no exista usuario con mismo email
      const existingEmail = await User.findByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Ya existe un usuario con este email');
      }

      // Encriptar contraseña
      const hashedPassword = await User.hashPassword(userData.password);

      // Crear objeto usuario
      const newUser = new User({
        ...userData,
        password: hashedPassword,
        fechaRegistro: new Date(),
        estado: 'activo'
      });

      // Guardar en Firestore usando cédula como ID
      await db.collection('users').doc(userData.cedula).set({
        cedula: newUser.cedula,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        email: newUser.email,
        telefono: newUser.telefono,
        password: newUser.password,
        rol: newUser.rol,
        fechaRegistro: newUser.fechaRegistro,
        estado: newUser.estado,
        fechaUltimoAcceso: null
      });

      // Retornar usuario sin contraseña
      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;

    } catch (error) {
      throw new Error(`Error creando usuario: ${error.message}`);
    }
  }

  // Buscar usuario por cédula
  static async findByCedula(cedula) {
    try {
      const doc = await db.collection('users').doc(cedula).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Error buscando usuario por cédula: ${error.message}`);
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const snapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      return null;
    } catch (error) {
      throw new Error(`Error buscando usuario por email: ${error.message}`);
    }
  }

  // Obtener todos los usuarios (con filtros opcionales)
  static async findAll(filters = {}) {
    try {
      let query = db.collection('users');

      // Aplicar filtros
      if (filters.rol) {
        query = query.where('rol', '==', filters.rol);
      }
      if (filters.estado) {
        query = query.where('estado', '==', filters.estado);
      }

      const snapshot = await query.get();
      const users = [];

      snapshot.forEach(doc => {
        const userData = { id: doc.id, ...doc.data() };
        // No incluir contraseña en la respuesta
        delete userData.password;
        users.push(userData);
      });

      return users;
    } catch (error) {
      throw new Error(`Error obteniendo usuarios: ${error.message}`);
    }
  }

  // Actualizar usuario
  static async update(cedula, updateData) {
    try {
      // Verificar que el usuario existe
      const existingUser = await User.findByCedula(cedula);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Si se actualiza la contraseña, encriptarla
      if (updateData.password) {
        updateData.password = await User.hashPassword(updateData.password);
      }

      // Actualizar en Firestore
      await db.collection('users').doc(cedula).update({
        ...updateData,
        fechaActualizacion: new Date()
      });

      // Retornar usuario actualizado sin contraseña
      const updatedUser = await User.findByCedula(cedula);
      delete updatedUser.password;
      return updatedUser;

    } catch (error) {
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }
  }

  // Eliminar usuario (cambiar estado a inactivo)
  static async delete(cedula) {
    try {
      await User.update(cedula, { estado: 'inactivo' });
      return { message: 'Usuario desactivado correctamente' };
    } catch (error) {
      throw new Error(`Error eliminando usuario: ${error.message}`);
    }
  }

  // Actualizar fecha de último acceso
  static async updateLastAccess(cedula) {
    try {
      await db.collection('users').doc(cedula).update({
        fechaUltimoAcceso: new Date()
      });
    } catch (error) {
      console.error('Error actualizando último acceso:', error);
    }
  }

  // Buscar usuarios (para funciones de búsqueda del admin)
  static async search(searchTerm, rol = null) {
    try {
      const users = await User.findAll({ rol });
      
      if (!searchTerm || searchTerm.trim() === '') {
        return users;
      }

      const term = searchTerm.toLowerCase();
      return users.filter(user => 
        user.cedula.includes(term) ||
        user.nombre.toLowerCase().includes(term) ||
        user.apellido.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.telefono && user.telefono.includes(term))
      );
    } catch (error) {
      throw new Error(`Error en búsqueda de usuarios: ${error.message}`);
    }
  }
}

export default User;