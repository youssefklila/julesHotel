import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File path for persisting user submissions
const DATA_DIR = path.join(process.cwd(), 'data');
const USER_SUBMISSIONS_FILE_PATH = path.join(DATA_DIR, 'user-submissions-data.json');

// Helper function to get user submissions from storage
function getUserSubmissionsFromStorage() {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Check if the file exists
    if (fs.existsSync(USER_SUBMISSIONS_FILE_PATH)) {
      // Read the file
      const fileContents = fs.readFileSync(USER_SUBMISSIONS_FILE_PATH, 'utf8');
      return JSON.parse(fileContents);
    }
    
    // If file doesn't exist, create it with empty array
    fs.writeFileSync(USER_SUBMISSIONS_FILE_PATH, JSON.stringify([], null, 2), 'utf8');
    return [];
  } catch (error) {
    console.error('Error getting user submissions from storage:', error);
    return [];
  }
}

// Helper function to save user submissions to storage
function saveUserSubmissionsToStorage(submissions: any[]) {
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(USER_SUBMISSIONS_FILE_PATH, JSON.stringify(submissions, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving user submissions to storage:', error);
    throw error;
  }
}

// GET /api/user-submissions - Check if a user has submitted a review recently
export async function GET(request: NextRequest) {
  try {
    // Get the IP address from the request
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    
    // Get submissions from storage
    const submissions = getUserSubmissionsFromStorage();
    
    // Find the most recent submission for this IP
    const userSubmission = submissions.find((sub: any) => sub.ip === ip);
    
    if (userSubmission) {
      const lastSubmission = new Date(userSubmission.timestamp);
      const now = new Date();
      const hoursDifference = (now.getTime() - lastSubmission.getTime()) / (1000 * 60 * 60);
      
      // Return the submission data with a hasSubmittedRecently flag
      return NextResponse.json({
        hasSubmittedRecently: hoursDifference < 24,
        lastSubmission: userSubmission.timestamp
      });
    }
    
    // No submission found for this IP
    return NextResponse.json({
      hasSubmittedRecently: false,
      lastSubmission: null
    });
  } catch (error) {
    console.error('Error checking user submission:', error);
    return NextResponse.json(
      { error: 'Failed to check user submission' },
      { status: 500 }
    );
  }
}

// POST /api/user-submissions - Record a new user submission
export async function POST(request: NextRequest) {
  try {
    // Get the IP address from the request
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    
    // Get submissions from storage
    const submissions = getUserSubmissionsFromStorage();
    
    // Find if there's an existing submission for this IP
    const existingIndex = submissions.findIndex((sub: any) => sub.ip === ip);
    
    const timestamp = new Date().toISOString();
    
    if (existingIndex !== -1) {
      // Update the existing submission
      submissions[existingIndex].timestamp = timestamp;
    } else {
      // Add a new submission
      submissions.push({
        ip,
        timestamp
      });
    }
    
    // Save the updated submissions
    saveUserSubmissionsToStorage(submissions);
    
    return NextResponse.json({
      success: true,
      timestamp
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording user submission:', error);
    return NextResponse.json(
      { error: 'Failed to record user submission' },
      { status: 500 }
    );
  }
}