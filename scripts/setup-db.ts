#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';

// Helper function to ask questions with optional hidden input
function question(query: string, options?: { hidden?: boolean }): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const isHidden = options?.hidden || false;
    let writeToOutput: any;

    if (isHidden) {
      // @ts-ignore - _writeToOutput is a private method but we need it
      writeToOutput = rl._writeToOutput;
      // @ts-ignore
      rl._writeToOutput = function _writeToOutput(stringToWrite: string) {
        if (stringToWrite === query) {
          // @ts-ignore
          writeToOutput.call(rl, stringToWrite);
        } else {
          // Don't show the input
          // @ts-ignore
          writeToOutput.call(rl, '');
        }
      };
    }


    rl.question(query, (answer) => {
      if (isHidden) {
        // Restore the original _writeToOutput method
        // @ts-ignore
        rl._writeToOutput = writeToOutput;
        console.log(); // Add a newline after hidden input
      }
      rl.close();
      resolve(answer);
    });
  });
}

// Main function
async function main() {
  console.log('\n🚀 Database Setup Wizard 🚀\n');
  console.log('This script will help you configure your database connection.\n');

  try {
    // Check if config.yml already exists
    const configPath = path.join(process.cwd(), 'config.yml');
    if (fs.existsSync(configPath)) {
      const overwrite = await question('⚠️  config.yml already exists. Do you want to overwrite it? (y/N): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('\nSetup cancelled. No changes were made.');
        return;
      }
    }

    // Get database connection details
    console.log('\n🔌 Database Connection Details');
    console.log('---------------------------');
    
    const dbHost = await question('Database Host (default: localhost): ') || 'localhost';
    const dbPort = await question('Database Port (default: 5432): ') || '5432';
    const dbName = await question('Database Name (required): ');
    const dbUser = await question('Database Username (required): ');
    const dbPassword = await question('Database Password (will be hidden): ', { hidden: true });

    if (!dbName || !dbUser) {
      throw new Error('Database name and username are required');
    }

    // Create config object
    const config = {
      db: {
        url: `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`
      }
    };

    // Write config file
    const yaml = require('js-yaml');
    fs.writeFileSync(configPath, yaml.dump(config));
    console.log(`\n✅ Configuration saved to ${configPath}`);

    // Test database connection
    console.log('\n🔍 Testing database connection...');
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: config.db.url,
        ssl: false
      });
      
      await pool.query('SELECT NOW()');
      console.log('✅ Successfully connected to the database!');
      
      // Ask to initialize database
      const initDb = await question('\nDo you want to initialize the database with default tables? (Y/n): ') || 'y';
      if (initDb.toLowerCase() === 'y') {
        console.log('\n🚀 Initializing database...');
        try {
          execSync('npm run db:init', { stdio: 'inherit' });
          console.log('\n✨ Database initialization complete!');
          console.log('\nDefault users created:');
          console.log('👤 Username: admin, Password: admin123');
          console.log('👑 Username: superadmin, Password: admin123');
          console.log('\n⚠️  IMPORTANT: Change these passwords after your first login!');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('\n❌ Error initializing database:', errorMessage);
        }
      }
      
      await pool.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('\n❌ Could not connect to the database:', errorMessage);
      console.log('\nPlease check your database configuration and try again.');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('\n❌ An error occurred:', errorMessage);
  }
}

// Run the setup
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
