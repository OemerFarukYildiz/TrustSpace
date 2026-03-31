import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function getOrgId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('org_id')?.value ?? null;
}

export async function getOrgName(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('org_name')?.value ?? null;
}

export async function getIntruderTag(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('intruder_tag')?.value ?? null;
}

export async function getLicenseLimits(): Promise<{ infrastructure: number; application: number } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('intruder_licenses')?.value;
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Returns orgId or a 401 response. Use in API routes:
 *   const result = await requireOrgId();
 *   if (result instanceof NextResponse) return result;
 *   const orgId = result;
 */
export async function requireOrgId(): Promise<string | NextResponse> {
  const orgId = await getOrgId();
  if (!orgId) {
    return NextResponse.json(
      { error: 'Nicht authentifiziert' },
      { status: 401 }
    );
  }
  return orgId;
}
