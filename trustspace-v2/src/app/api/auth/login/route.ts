import { NextRequest, NextResponse } from 'next/server';

const CREDENTIALS: Record<string, {
  orgId: string;
  orgName: string;
  intruderTag: string;
  licenses: { infrastructure: number; application: number };
}> = {
  trustspace: {
    orgId: 'trustspace-org',
    orgName: 'TrustSpace GmbH',
    intruderTag: 'TrustSpace',
    licenses: { infrastructure: 5, application: 3 },
  },
  eduneon: {
    orgId: 'eduneon-org',
    orgName: 'Eduneon GmbH',
    intruderTag: 'Eduneon',
    licenses: { infrastructure: 3, application: 1 },
  },
};

const MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username: string = (body.username ?? '').trim();
    const password: string = (body.password ?? '').trim();

    const key = username.toLowerCase();
    const match = CREDENTIALS[key];

    if (!match || password !== 'Admin') {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, orgId: match.orgId });

    response.cookies.set('org_id', match.orgId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });

    response.cookies.set('org_name', match.orgName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });

    response.cookies.set('intruder_tag', match.intruderTag, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });

    response.cookies.set('intruder_licenses', JSON.stringify(match.licenses), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
