import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

// Helper function to get notifications from storage
function getNotificationsFromStorage() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'notifications-data.json');
    
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
    console.error('Error reading notifications:', error);
    return [];
  }
}

// Helper function to save notifications to storage
function saveNotificationsToStorage(notifications: any[]) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'notifications-data.json');
    fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
}

// GET /api/notifications - Get all notifications
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const adminAuth = cookieStore.get('adminAuth');
    const superAdminAuth = cookieStore.get('superAdminAuth');
    
    if (!adminAuth && !superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const notifications = getNotificationsFromStorage();
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const adminAuth = cookieStore.get('adminAuth');
    const superAdminAuth = cookieStore.get('superAdminAuth');
    
    if (!adminAuth && !superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !body.message) {
      return NextResponse.json(
        { error: 'Type and message are required' },
        { status: 400 }
      );
    }
    
    // Create new notification
    const newNotification = {
      id: `notification-${Date.now()}`,
      type: body.type,
      message: body.message,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    // Get existing notifications and add the new one
    const notifications = getNotificationsFromStorage();
    notifications.push(newNotification);
    
    // Save updated notifications
    saveNotificationsToStorage(notifications);
    
    return NextResponse.json(newNotification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/:id - Update a notification (mark as read)
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies();
    const adminAuth = cookieStore.get('adminAuth');
    const superAdminAuth = cookieStore.get('superAdminAuth');
    
    if (!adminAuth && !superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }
    
    // Get existing notifications
    const notifications = getNotificationsFromStorage();
    
    // Find the notification to update
    const notificationIndex = notifications.findIndex(n => n.id === body.id);
    
    // Notification not found
    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Update the notification
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      ...body,
    };
    
    // Save updated notifications
    saveNotificationsToStorage(notifications);
    
    return NextResponse.json(notifications[notificationIndex]);
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}