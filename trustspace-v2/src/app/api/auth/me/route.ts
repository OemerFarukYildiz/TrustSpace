import { NextResponse } from 'next/server';
import { getOrgId, getOrgName } from '@/lib/auth';

export async function GET() {
  const orgId = await getOrgId();
  const orgName = await getOrgName();
  return NextResponse.json({ orgId, orgName });
}
