import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';

export interface RegisteredUser {
  id: string;
  uid: string;
  nombre: string;
  email: string;
  telefono?: string;
  dni?: string;
  role: string;
  estado: string;
  creadoEn: Date;
  ultimoAcceso?: Date;
  avatar?: string;
  metadata?: Record<string, unknown>;
}

export interface UserSearchFilters {
  search?: string;
  role?: string;
  estado?: string;
  excludeAsociacionId?: string;
}

export interface UserSearchResult {
  users: RegisteredUser[];
  total: number;
  hasMore: boolean;
}

class UserSearchService {
  private readonly usersCollection = COLLECTIONS.USERS;
  private readonly sociosCollection = COLLECTIONS.SOCIOS;

  /**
   * Search for registered users that can be added as socios
   */
  async searchRegisteredUsers(
    filters: UserSearchFilters = {},
    pageSize = 10
  ): Promise<UserSearchResult> {
    try {
      console.log('🔍 Searching users with filters:', filters);

      // First, get existing socios for the association to exclude them
      const existingSociosEmails = await this.getExistingSociosEmails(filters.excludeAsociacionId);
      console.log('📧 Existing socios emails:', existingSociosEmails);

      let allUsers: RegisteredUser[] = [];

      // Search in users collection
      const usersFromUsersCollection = await this.searchInUsersCollection(filters, pageSize);
      console.log(`👥 Found ${usersFromUsersCollection.length} users in users collection`);
      allUsers = [...usersFromUsersCollection];

      // Search in socios collection (for socios that might not be in users collection)
      const usersFromSociosCollection = await this.searchInSociosCollection(filters, pageSize);
      console.log(`👤 Found ${usersFromSociosCollection.length} users in socios collection`);
      
      // Merge results, avoiding duplicates by email
      const existingEmails = new Set(allUsers.map(u => u.email.toLowerCase()));
      const uniqueSociosUsers = usersFromSociosCollection.filter(u => !existingEmails.has(u.email.toLowerCase()));
      allUsers = [...allUsers, ...uniqueSociosUsers];

      console.log(`👥 Total users before filtering: ${allUsers.length}`);

      // Filter out existing socios from this association
      const usersBeforeFilter = allUsers.length;
      allUsers = allUsers.filter(user => !existingSociosEmails.includes(user.email.toLowerCase()));
      console.log(`🚫 Filtered out ${usersBeforeFilter - allUsers.length} existing socios`);

      // Apply client-side search filters
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase().trim();
        console.log('🔍 Applying search filter:', searchTerm);
        
        const usersBeforeSearch = allUsers.length;
        allUsers = allUsers.filter(user => {
          const matchesName = user.nombre.toLowerCase().includes(searchTerm);
          const matchesEmail = user.email.toLowerCase().includes(searchTerm);
          const matchesDni = user.dni && user.dni.toString().includes(searchTerm); // Fixed: no toLowerCase() for DNI
          const matchesPhone = user.telefono && user.telefono.includes(searchTerm);
          
          return matchesName || matchesEmail || matchesDni || matchesPhone;
        });
        console.log(`🔍 Search filtered: ${usersBeforeSearch} -> ${allUsers.length} users`);
      }

      // Sort by name
      allUsers.sort((a, b) => a.nombre.localeCompare(b.nombre));

      // Apply pagination
      const hasMore = allUsers.length > pageSize;
      if (hasMore) {
        allUsers = allUsers.slice(0, pageSize);
      }

      console.log(`✅ Final result: ${allUsers.length} users found`);

      return {
        users: allUsers,
        total: allUsers.length,
        hasMore
      };
    } catch (error) {
      console.error('❌ Error in searchRegisteredUsers:', error);
      handleError(error, 'Search Registered Users');
      return {
        users: [],
        total: 0,
        hasMore: false
      };
    }
  }

  /**
   * Search in users collection
   */
  private async searchInUsersCollection(
    filters: UserSearchFilters,
    pageSize: number
  ): Promise<RegisteredUser[]> {
    try {
      // Build base query for users collection
      const q = filters.role === 'socio'
        ? query(
            collection(db, this.usersCollection),
            where('role', '==', 'socio'),
            where('estado', '==', 'activo'),
            orderBy('nombre', 'asc'),
            limit(pageSize * 2)
          )
        : query(
            collection(db, this.usersCollection),
            where('estado', '==', 'activo'),
            orderBy('nombre', 'asc'),
            limit(pageSize * 2) // Get more to account for filtering
          );

      console.log('🔍 Executing Firestore query on users collection...');
      
      // Execute query
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      console.log(`📊 Found ${docs.length} users in users collection`);

      const users = docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          uid: data.uid || doc.id,
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono,
          dni: data.dni,
          role: data.role || '',
          estado: data.estado || 'activo',
          creadoEn: data.creadoEn?.toDate() || new Date(),
          ultimoAcceso: data.ultimoAcceso?.toDate(),
          avatar: data.avatar,
          metadata: data.metadata,
        } as RegisteredUser;
      });

      return users;
    } catch (error) {
      console.error('❌ Error searching in users collection:', error);
      return [];
    }
  }

  /**
   * Search in socios collection
   */
  private async searchInSociosCollection(
    filters: UserSearchFilters,
    pageSize: number
  ): Promise<RegisteredUser[]> {
    try {
      // Build query for socios collection
      const q = query(
        collection(db, this.sociosCollection),
        where('estado', '==', 'activo'),
        orderBy('nombre', 'asc'),
        limit(pageSize * 2) // Get more to account for filtering
      );

      console.log('🔍 Executing Firestore query on socios collection...');
      
      // Execute query
      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      
      console.log(`📊 Found ${docs.length} users in socios collection`);

      const users = docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          uid: data.uid || doc.id,
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono,
          dni: data.dni,
          role: 'socio', // All users in socios collection are socios
          estado: data.estado || 'activo',
          creadoEn: data.creadoEn?.toDate() || new Date(),
          ultimoAcceso: data.ultimoAcceso?.toDate(),
          avatar: data.avatar,
          metadata: data.metadata,
        } as RegisteredUser;
      });

      return users;
    } catch (error) {
      console.error('❌ Error searching in socios collection:', error);
      return [];
    }
  }

  /**
   * Get user by ID for detailed information
   */
  async getUserById(userId: string): Promise<RegisteredUser | null> {
    try {
      console.log('🔍 Getting user by ID:', userId);
      
      // Try to get user by document ID first
      const userDocRef = doc(db, this.usersCollection, userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('✅ Found user by document ID:', data.nombre);
        
        return {
          id: userDoc.id,
          uid: data.uid || userDoc.id,
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono,
          dni: data.dni,
          role: data.role || '',
          estado: data.estado || 'activo',
          creadoEn: data.creadoEn?.toDate() || new Date(),
          ultimoAcceso: data.ultimoAcceso?.toDate(),
          avatar: data.avatar,
          metadata: data.metadata,
        } as RegisteredUser;
      }

      // If not found by document ID, try by uid field
      console.log('🔍 User not found by document ID, trying by uid field...');
      const userQuery = query(
        collection(db, this.usersCollection),
        where('uid', '==', userId),
        limit(1)
      );

      const snapshot = await getDocs(userQuery);
      
      if (snapshot.empty) {
        console.log('❌ User not found by uid field either:', userId);
        return null;
      }

      const docSnapshot = snapshot.docs[0];
      const data = docSnapshot.data();
      console.log('✅ Found user by uid field:', data.nombre);

      return {
        id: docSnapshot.id,
        uid: data.uid || docSnapshot.id,
        nombre: data.nombre || '',
        email: data.email || '',
        telefono: data.telefono,
        dni: data.dni,
        role: data.role || '',
        estado: data.estado || 'activo',
        creadoEn: data.creadoEn?.toDate() || new Date(),
        ultimoAcceso: data.ultimoAcceso?.toDate(),
        avatar: data.avatar,
        metadata: data.metadata,
      } as RegisteredUser;
    } catch (error) {
      console.error('❌ Error getting user by ID:', error);
      handleError(error, 'Get User By ID');
      return null;
    }
  }

  /**
   * Check if user can be added as socio
   */
  async canAddAsSocio(userId: string, asociacionId: string): Promise<{
    canAdd: boolean;
    reason?: string;
  }> {
    try {
      console.log('🔍 Checking if user can be added as socio:', { userId, asociacionId });
      
      // Check if user exists
      const user = await this.getUserById(userId);
      if (!user) {
        console.log('❌ User not found');
        return { canAdd: false, reason: 'Usuario no encontrado' };
      }

      // Check if user is active
      if (user.estado !== 'activo') {
        console.log('❌ User not active:', user.estado);
        return { canAdd: false, reason: 'El usuario no está activo' };
      }

      // Check if user is already a socio in this association
      const existingSocioQuery = query(
        collection(db, this.sociosCollection),
        where('email', '==', user.email.toLowerCase()),
        where('asociacionId', '==', asociacionId),
        limit(1)
      );

      const existingSocioSnapshot = await getDocs(existingSocioQuery);
      if (!existingSocioSnapshot.empty) {
        console.log('❌ User already is socio in this association');
        return { canAdd: false, reason: 'El usuario ya es socio de esta asociación' };
      }

      console.log('✅ User can be added as socio');
      return { canAdd: true };
    } catch (error) {
      console.error('❌ Error checking if user can be added as socio:', error);
      handleError(error, 'Can Add As Socio');
      return { canAdd: false, reason: 'Error al verificar el usuario' };
    }
  }

  /**
   * Get emails of existing socios for an association
   */
  private async getExistingSociosEmails(asociacionId?: string): Promise<string[]> {
    if (!asociacionId) {
      console.log('⚠️ No asociacionId provided for filtering existing socios');
      return [];
    }

    try {
      console.log('🔍 Getting existing socios emails for association:', asociacionId);
      
      const sociosQuery = query(
        collection(db, this.sociosCollection),
        where('asociacionId', '==', asociacionId)
      );

      const snapshot = await getDocs(sociosQuery);
      const emails = snapshot.docs.map(docSnapshot => docSnapshot.data().email?.toLowerCase() || '').filter(Boolean);
      
      console.log(`📧 Found ${emails.length} existing socios emails:`, emails);
      return emails;
    } catch (error) {
      console.error('❌ Error getting existing socios emails:', error);
      return [];
    }
  }

  /**
   * Search users by email specifically
   */
  async searchByEmail(email: string, excludeAsociacionId?: string): Promise<RegisteredUser[]> {
    try {
      console.log('🔍 Searching users by email:', email);
      
      const userQuery = query(
        collection(db, this.usersCollection),
        where('email', '==', email.toLowerCase()),
        where('estado', '==', 'activo'),
        limit(5)
      );

      const snapshot = await getDocs(userQuery);
      
      if (snapshot.empty) {
        console.log('❌ No users found with email:', email);
        return [];
      }

      const users = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          uid: data.uid || docSnapshot.id,
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono,
          dni: data.dni,
          role: data.role || '',
          estado: data.estado || 'activo',
          creadoEn: data.creadoEn?.toDate() || new Date(),
          ultimoAcceso: data.ultimoAcceso?.toDate(),
          avatar: data.avatar,
          metadata: data.metadata,
        } as RegisteredUser;
      });

      console.log(`✅ Found ${users.length} users with email ${email}`);

      // Filter out existing socios if association ID is provided
      if (excludeAsociacionId) {
        const existingSociosEmails = await this.getExistingSociosEmails(excludeAsociacionId);
        const filteredUsers = users.filter(user => !existingSociosEmails.includes(user.email.toLowerCase()));
        console.log(`🚫 After filtering existing socios: ${filteredUsers.length} users`);
        return filteredUsers;
      }

      return users;
    } catch (error) {
      console.error('❌ Error searching by email:', error);
      handleError(error, 'Search By Email');
      return [];
    }
  }

  /**
   * Search users by DNI specifically (more efficient for DNI searches)
   */
  async searchByDni(dni: string, excludeAsociacionId?: string): Promise<RegisteredUser[]> {
    try {
      console.log('🔍 Searching users by DNI:', dni);
      
      const dniSearchTerm = dni.toString().trim();
      let allUsers: RegisteredUser[] = [];

      // Search in users collection
      const usersQuery = query(
        collection(db, this.usersCollection),
        where('dni', '==', dniSearchTerm),
        where('estado', '==', 'activo'),
        limit(5)
      );

      const usersSnapshot = await getDocs(usersQuery);
      const usersFromUsers = usersSnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          uid: data.uid || docSnapshot.id,
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono,
          dni: data.dni,
          role: data.role || '',
          estado: data.estado || 'activo',
          creadoEn: data.creadoEn?.toDate() || new Date(),
          ultimoAcceso: data.ultimoAcceso?.toDate(),
          avatar: data.avatar,
          metadata: data.metadata,
        } as RegisteredUser;
      });

      allUsers = [...usersFromUsers];

      // Search in socios collection
      const sociosQuery = query(
        collection(db, this.sociosCollection),
        where('dni', '==', dniSearchTerm),
        where('estado', '==', 'activo'),
        limit(5)
      );

      const sociosSnapshot = await getDocs(sociosQuery);
      const usersFromSocios = sociosSnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          uid: data.uid || docSnapshot.id,
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono,
          dni: data.dni,
          role: 'socio',
          estado: data.estado || 'activo',
          creadoEn: data.creadoEn?.toDate() || new Date(),
          ultimoAcceso: data.ultimoAcceso?.toDate(),
          avatar: data.avatar,
          metadata: data.metadata,
        } as RegisteredUser;
      });

      // Merge results, avoiding duplicates by email
      const existingEmails = new Set(allUsers.map(u => u.email.toLowerCase()));
      const uniqueSociosUsers = usersFromSocios.filter(u => !existingEmails.has(u.email.toLowerCase()));
      allUsers = [...allUsers, ...uniqueSociosUsers];

      console.log(`✅ Found ${allUsers.length} users with DNI ${dni}`);

      // Filter out existing socios if association ID is provided
      if (excludeAsociacionId) {
        const existingSociosEmails = await this.getExistingSociosEmails(excludeAsociacionId);
        const filteredUsers = allUsers.filter(user => !existingSociosEmails.includes(user.email.toLowerCase()));
        console.log(`🚫 After filtering existing socios: ${filteredUsers.length} users`);
        return filteredUsers;
      }

      return allUsers;
    } catch (error) {
      console.error('❌ Error searching by DNI:', error);
      handleError(error, 'Search By DNI');
      return [];
    }
  }

  /**
   * Debug method to check collections and data
   */
  async debugCollections(): Promise<void> {
    try {
      console.log('🔍 DEBUG: Checking collections...');
      
      // Check users collection
      const usersQuery = query(collection(db, this.usersCollection), limit(5));
      const usersSnapshot = await getDocs(usersQuery);
      console.log(`👥 Users collection: ${usersSnapshot.docs.length} documents`);
      
      usersSnapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        console.log(`  - User: ${data.nombre} (${data.email}) - Role: ${data.role} - Estado: ${data.estado}`);
      });

      // Check socios collection
      const sociosQuery = query(collection(db, this.sociosCollection), limit(5));
      const sociosSnapshot = await getDocs(sociosQuery);
      console.log(`👤 Socios collection: ${sociosSnapshot.docs.length} documents`);
      
      sociosSnapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data();
        console.log(`  - Socio: ${data.nombre} (${data.email}) - AsociacionId: ${data.asociacionId}`);
      });
      
    } catch (error) {
      console.error('❌ Error in debug:', error);
    }
  }

  /**
   * Alternative method to get user data from socios collection if not found in users
   */
  async getUserFromSociosCollection(userId: string): Promise<RegisteredUser | null> {
    try {
      console.log('🔍 Trying to get user from socios collection:', userId);
      
      // Try by document ID first
      const socioDocRef = doc(db, this.sociosCollection, userId);
      const socioDoc = await getDoc(socioDocRef);
      
      if (socioDoc.exists()) {
        const data = socioDoc.data();
        console.log('✅ Found user in socios collection by document ID:', data.nombre);
        
        return {
          id: socioDoc.id,
          uid: data.uid || socioDoc.id,
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono,
          dni: data.dni,
          role: 'socio', // Default role for socios collection
          estado: data.estado || 'activo',
          creadoEn: data.creadoEn?.toDate() || new Date(),
          ultimoAcceso: data.ultimoAcceso?.toDate(),
          avatar: data.avatar,
          metadata: data.metadata,
        } as RegisteredUser;
      }

      // Try by uid field
      const socioQuery = query(
        collection(db, this.sociosCollection),
        where('uid', '==', userId),
        limit(1)
      );

      const snapshot = await getDocs(socioQuery);
      
      if (!snapshot.empty) {
        const docSnapshot = snapshot.docs[0];
        const data = docSnapshot.data();
        console.log('✅ Found user in socios collection by uid field:', data.nombre);

        return {
          id: docSnapshot.id,
          uid: data.uid || docSnapshot.id,
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono,
          dni: data.dni,
          role: 'socio',
          estado: data.estado || 'activo',
          creadoEn: data.creadoEn?.toDate() || new Date(),
          ultimoAcceso: data.ultimoAcceso?.toDate(),
          avatar: data.avatar,
          metadata: data.metadata,
        } as RegisteredUser;
      }

      console.log('❌ User not found in socios collection either');
      return null;
    } catch (error) {
      console.error('❌ Error getting user from socios collection:', error);
      return null;
    }
  }

  /**
   * Enhanced getUserById that checks both collections
   */
  async getUserByIdEnhanced(userId: string): Promise<RegisteredUser | null> {
    try {
      console.log('🔍 Enhanced search for user ID:', userId);
      
      // First try users collection
      let user = await this.getUserById(userId);
      
      if (user) {
        console.log('✅ Found user in users collection');
        return user;
      }

      // If not found, try socios collection
      console.log('🔍 User not found in users collection, trying socios collection...');
      user = await this.getUserFromSociosCollection(userId);
      
      if (user) {
        console.log('✅ Found user in socios collection');
        return user;
      }

      console.log('❌ User not found in any collection');
      return null;
    } catch (error) {
      console.error('❌ Error in enhanced user search:', error);
      return null;
    }
  }
}

// Export singleton instance
export const userSearchService = new UserSearchService();
export default userSearchService;