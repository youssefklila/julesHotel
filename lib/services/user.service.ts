import { query } from '../db';
import { 
  User, 
  FIND_USER_BY_USERNAME, 
  UPDATE_USER_LAST_LOGIN 
} from '../schema';
import bcrypt from 'bcrypt';

export class UserService {
  static async findByUsername(username: string): Promise<User | null> {
    const users = await query<User>(FIND_USER_BY_USERNAME, [username]);
    return users[0] || null;
  }

  static async updateLastLogin(userId: string): Promise<void> {
    await query(UPDATE_USER_LAST_LOGIN, [userId]);
  }

  static async validateCredentials(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (!user) return null;
    
    const passwordMatches = await this.verifyPassword(password, user.password);
    return passwordMatches ? user : null;
  }

  private static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }
}
