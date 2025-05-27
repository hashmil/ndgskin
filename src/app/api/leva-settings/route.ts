import { NextRequest, NextResponse } from "next/server";
import { query, initializeDatabase } from "@/utils/database";

// Initialize database on first load
let dbInitialized = false;

const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
};

export async function GET() {
  try {
    await ensureDbInitialized();
    
    const result = await query('SELECT key, value FROM leva_settings');
    
    // Convert array of settings to object for easier use
    const settings: Record<string, any> = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching Leva settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const { key, value } = await req.json();
    
    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }
    
    await query(
      `INSERT INTO leva_settings (key, value, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       ON CONFLICT (key) 
       DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(value)]
    );
    
    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Error saving Leva settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureDbInitialized();
    
    const { settings } = await req.json();
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Settings object is required' },
        { status: 400 }
      );
    }
    
    // Save multiple settings at once
    for (const [key, value] of Object.entries(settings)) {
      await query(
        `INSERT INTO leva_settings (key, value, updated_at) 
         VALUES ($1, $2, CURRENT_TIMESTAMP) 
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify(value)]
      );
    }
    
    return NextResponse.json({ success: true, message: 'All settings saved' });
  } catch (error) {
    console.error('Error saving multiple Leva settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}