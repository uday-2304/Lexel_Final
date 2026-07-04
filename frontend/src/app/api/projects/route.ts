import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the shape of our project data
export interface BoardHistory {
  id: string
  name: string
  lastOpened: number
}

type Database = Record<string, BoardHistory[]>

const DB_PATH = path.join(process.cwd(), 'db.json');

// Helper to read DB
function readDB(): Database {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}));
    return {};
  }
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

// Helper to write DB
function writeDB(db: Database) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get('apiKey');

  if (!apiKey) {
    return NextResponse.json({ error: 'Missing apiKey' }, { status: 400 });
  }

  const db = readDB();
  const projects = db[apiKey] || [];

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { apiKey, board } = body;

    if (!apiKey || !board || !board.id) {
      return NextResponse.json({ error: 'Missing apiKey or board data' }, { status: 400 });
    }

    const db = readDB();
    if (!db[apiKey]) {
      db[apiKey] = [];
    }

    // Remove if it exists
    db[apiKey] = db[apiKey].filter(b => b.id !== board.id);
    
    // Add to top
    db[apiKey].unshift({ ...board, lastOpened: Date.now() });

    // Keep only last 10
    db[apiKey] = db[apiKey].slice(0, 10);

    writeDB(db);

    return NextResponse.json({ success: true, projects: db[apiKey] });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get('apiKey');
  const boardId = searchParams.get('id');

  if (!apiKey || !boardId) {
    return NextResponse.json({ error: 'Missing apiKey or board id' }, { status: 400 });
  }

  const db = readDB();
  if (db[apiKey]) {
    db[apiKey] = db[apiKey].filter(b => b.id !== boardId);
    writeDB(db);
  }

  return NextResponse.json({ success: true, projects: db[apiKey] || [] });
}
