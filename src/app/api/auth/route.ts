import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createUser, authenticateUser } from '@/lib/user';

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();

    switch (action) {
      case 'register': {
        const result = await createUser(data);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Create JWT token
        const token = await createToken(result.user!.id, result.user!.role);
        return NextResponse.json({
          user: result.user,
          token
        });
      }

      case 'login': {
        const result = await authenticateUser(data.email, data.password);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 401 });
        }

        // Create JWT token
        const token = await createToken(result.user!.id, result.user!.role);
        return NextResponse.json({
          user: result.user,
          token
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createToken(userId: number, role: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId.toString())
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);
  
  return token;
} 