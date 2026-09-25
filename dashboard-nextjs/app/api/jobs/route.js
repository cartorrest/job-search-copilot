// app/api/jobs/route.js
//
// The browser calls this route to load every application. It delegates to
// listJobs() in lib/appsScript.js, the only code that knows the token and
// talks to Google. The browser only ever sees the final JSON.

import { NextResponse } from 'next/server';
import { listJobs } from '@/lib/appsScript';

export async function GET() {
  try {
    const jobs = await listJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('[api/jobs] Error loading applications:', error);
    return NextResponse.json(
      { error: 'Could not reach the tracker. Check the configuration.' },
      { status: 502 }
    );
  }
}
