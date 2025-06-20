#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as yaml from 'js-yaml';

// Load database configuration
const loadDbConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'config.yml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as any;
    return config.db;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error loading database config:', errorMessage);
    process.exit(1);
  }
};

// Parse connection string
const parseConnectionString = (connectionString: string) => {
  const url = new URL(connectionString);
  return {
    user: url.username,
    password: url.password,
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.replace(/^\//, ''),
  };
};

// Format date for filename
const formatDate = (date: Date) => {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    '-',
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('');
};

// Main function
async function main() {
  console.log('\n💾 Database Backup Utility\n');
  
  try {
    // Load config
    const dbConfig = loadDbConfig();
    const { user, password, host, port, database } = parseConnectionString(dbConfig.url);
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Generate backup filename
    const timestamp = formatDate(new Date());
    const backupFile = path.join(backupDir, `${database}_backup_${timestamp}.sql`);
    
    console.log(`📋 Database: ${database}`);
    console.log(`🌐 Host: ${host}:${port}`);
    console.log(`👤 User: ${user}`);
    console.log(`💾 Backup file: ${backupFile}\n`);
    
    // Set environment variables for pg_dump
    process.env.PGPASSWORD = password;
    
    // Run pg_dump
    const command = `pg_dump --host=${host} --port=${port} --username=${user} --dbname=${database} --file="${backupFile}" --format=plain --no-owner --no-privileges --no-tablespaces --inserts --column-inserts`;
    
    console.log('⏳ Creating backup...');
    execSync(command, { stdio: 'inherit' });
    
    // Check if backup was successful
    if (fs.existsSync(backupFile)) {
      const stats = fs.statSync(backupFile);
      const fileSize = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`\n✅ Backup completed successfully!`);
      console.log(`📊 File size: ${fileSize} MB`);
      console.log(`📂 Location: ${backupFile}`);
      
      // List recent backups
      const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.sql'))
        .sort()
        .reverse()
        .slice(0, 5);
      
      if (files.length > 0) {
        console.log('\n📅 Recent backups:');
        files.forEach(file => {
          const stats = fs.statSync(path.join(backupDir, file));
          console.log(`- ${file} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
        });
      }
    } else {
      throw new Error('Backup file was not created');
    }
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('\n❌ Backup failed:', errorMessage);
    process.exit(1);
  } finally {
    // Clean up
    if (process.env.PGPASSWORD) {
      delete process.env.PGPASSWORD;
    }
  }
}

// Run the backup
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
