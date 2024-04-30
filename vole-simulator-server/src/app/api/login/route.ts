import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET = async () => {
  return NextResponse.json({ message: 'Hello, Next.js Version 13!' }, { status: 200 });
};

async function authenticateUser(email: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) return false;
  
  // For demonstration: just a direct comparison, replace with hashed password check in production!
  return user.password === password;
}

export const POST = async (request: NextRequest) => {
  try {
    const { email, password } = await request.json();
    console.log(email)
    if (!email || !password) {
      return new NextResponse(JSON.stringify({ message: 'email and password are required' }), { status: 400 });
    }

    const isAuthenticated = await authenticateUser(email, password);

    if (!isAuthenticated) {
      return new NextResponse(JSON.stringify({ message: 'Invalid email or password' }), { status: 401 });
    }

    return new NextResponse(JSON.stringify({ message: 'Login successful' }), { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return new NextResponse(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
};