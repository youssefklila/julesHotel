import { query } from '../lib/db';

async function checkAndFixUser(username: string) {
  try {
    // Check user status
    const result = await query(
      'SELECT id, username, role, is_active FROM users WHERE username = $1',
      [username]
    );

    if (result.length === 0) {
      console.log(`❌ User '${username}' not found`);
      return;
    }

    const user = result[0];
    console.log('Current user status:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Username: ${user.username}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Active: ${user.is_active}`);

    if (!user.is_active) {
      console.log('\n🔧 Attempting to activate user...');
      await query(
        'UPDATE users SET is_active = true WHERE id = $1',
        [user.id]
      );
      console.log('✅ User activated successfully!');
    } else {
      console.log('\n✅ User is already active');
    }
  } catch (error) {
    console.error('Error checking/updating user:', error);
  }
}

// Run for both admin and superadmin
checkAndFixUser('admin');
checkAndFixUser('superadmin');
