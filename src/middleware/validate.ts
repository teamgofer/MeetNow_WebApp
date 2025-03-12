import { NextResponse } from 'next/server';
import { z } from 'zod';

export function validateRequest<T extends z.ZodType>(
  schema: T,
  handler: (validatedData: z.infer<T>) => Promise<Response>
) {
  return async (request: Request) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return handler(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
  };
}

// Common validation schemas
export const userSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
});

export const postSchema = z.object({
  content: z.string().min(1).max(1000),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  restriction: z.enum(['public', 'private', 'group', 'premium']),
});

export const groupSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
}); 