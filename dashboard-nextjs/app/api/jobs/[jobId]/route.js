// app/api/jobs/[jobId]/route.js
//
// [jobId] is a Next.js dynamic segment: PATCH /api/jobs/JOB-004 gives
// jobId = "JOB-004".
//
// Next.js 15 note: 'params' is now a Promise (it was a plain object in
// Next 14). Without 'await', jobId is undefined and the route fails silently.

import { NextResponse } from 'next/server';
import { updateJob } from '@/lib/appsScript';

export async function PATCH(request, { params }) {
  const { jobId } = await params;

  try {
    const { fields } = await request.json();
    const result = await updateJob(jobId, fields);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[api/jobs/${jobId}] Error updating:`, error);
    return NextResponse.json(
      { error: 'Could not update the application. Please try again.' },
      { status: 502 }
    );
  }
}

