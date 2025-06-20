import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

// Helper function to get audit logs from storage
function getAuditLogsFromStorage() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'audit-logs-data.json');
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create file if it doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]), 'utf8');
      return [];
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading audit logs:', error);
    return [];
  }
}

// Helper function to save audit logs to storage
function saveAuditLogsToStorage(logs: any[]) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'audit-logs-data.json');
    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving audit logs:', error);
  }
}

// GET /api/audit-logs - Get all audit logs
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('adminAuth')?.value;
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;

    if (!adminAuth && !superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const auditLogs = getAuditLogsFromStorage();
    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to get audit logs' },
      { status: 500 }
    );
  }
}

// POST /api/audit-logs - Create a new audit log
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('adminAuth')?.value;
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;

    if (!adminAuth && !superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    // Get user from cookies
    let user = 'Unknown';
    if (adminAuth) {
      user = cookieStore.get('adminUser')?.value || 'Unknown Admin';    
    } else if (superAdminAuth) {
      user = cookieStore.get('superAdminUser')?.value || 'Unknown Super Admin';
    }
    
    // Create new audit log
    const newAuditLog = {
      id: `audit-${Date.now()}`,
      action: body.action,
      user,
      timestamp: new Date().toISOString(),
      details: body.details || '',
    };
    
    // Get existing audit logs and add the new one
    const auditLogs = getAuditLogsFromStorage();
    auditLogs.push(newAuditLog);
    
    // Save updated audit logs
    saveAuditLogsToStorage(auditLogs);
    
    return NextResponse.json(newAuditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}