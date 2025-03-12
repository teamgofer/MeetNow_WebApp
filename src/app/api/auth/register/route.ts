import { NextResponse } from 'next/server';
import { validateRequest, userSchema } from '@/middleware/validate';
import { createUser } from '@/lib/user';

export async function POST(request: Request) {
  return validateRequest(userSchema, async (data) => {
    try {
      const result = await createUser(data);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { user: result.user },
        { status: 201 }
      );
    } catch (error) {
      console.error('Registration error:', error);
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 500 }
      );
    }
  })(request);
} 