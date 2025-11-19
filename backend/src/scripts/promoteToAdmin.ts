import './loadEnv';
import { User } from '../models/User';
import { usersCollection, firestoreHelpers } from '../services/firebase-db';

// Script to promote a user to admin
// Usage: ts-node backend/src/scripts/promoteToAdmin.ts <email or userId>
async function promoteToAdmin() {
  const identifier = process.argv[2];
  
  if (!identifier) {
    console.error('Usage: ts-node promoteToAdmin.ts <email or userId>');
    process.exit(1);
  }

  try {
    let user;
    
    // Try to find by email first
    if (identifier.includes('@')) {
      const snapshot = await usersCollection().where('email', '==', identifier).limit(1).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        user = {
          id: doc.id,
          ...data,
          createdAt: firestoreHelpers.timestampToDate(data.createdAt),
          updatedAt: firestoreHelpers.timestampToDate(data.updatedAt)
        } as any;
      }
    } else {
      // Try to find by ID
      user = await User.findById(identifier);
    }

    if (!user) {
      console.error(`User not found: ${identifier}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    console.log(`Current role: ${user.role || 'user'}, isAdmin: ${user.isAdmin || false}`);

    // Promote to admin
    const updatedUser = await User.update(user.id, {
      role: 'admin',
      isAdmin: true
    });

    if (updatedUser) {
      console.log(`✅ Successfully promoted ${updatedUser.name} to admin!`);
      console.log(`   Role: ${updatedUser.role}, isAdmin: ${updatedUser.isAdmin}`);
    } else {
      console.error('Failed to update user');
      process.exit(1);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('Error promoting user to admin:', error);
    process.exit(1);
  }
}

promoteToAdmin();









