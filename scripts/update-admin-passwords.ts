import { query } from '../lib/db';
import bcrypt from 'bcrypt';

async function updateAdminPasswords() {
  try {
    // Define the admin users and their new passwords
    const adminUsers = [
      { username: 'admin', password: 'admin123' },
      { username: 'superadmin', password: 'hotel2024super' }
    ];

    // Hash and update each admin password
    for (const user of adminUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      // Update the password in the database
      const result = await query(
        'UPDATE users SET password = $1 WHERE username = $2 RETURNING username',
        [hashedPassword, user.username]
      );

      if (result && result.length > 0) {
        console.log(`✅ Updated password for user: ${user.username}`);
      } else {
        console.log(`❌ User not found: ${user.username}`);
      }
    }
    
    console.log('\n✅ Password update completed');
  } catch (error) {
    console.error('Error updating admin passwords:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
updateAdminPasswords();
