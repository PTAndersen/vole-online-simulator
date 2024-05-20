import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';


async function authenticateUser(email: string, password: string): Promise<any> {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return null;
  }
  
  return user;
}

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email, password} = body;

    if (!email || !password) {
      return new NextResponse(JSON.stringify({ message: 'Email and password are required' }), { status: 400 });
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return new NextResponse(JSON.stringify({ message: 'Invalid email or password' }), { status: 401 });
    }

    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined. Please check your .env file or environment settings.');
    }
  
    const payload = {
      userId: user.id,
      email: email,
      role: user.role.toUpperCase()
  };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    return new NextResponse(JSON.stringify({ message: 'Login successful', token, role: user.role.toUpperCase() }), { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return new NextResponse(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
};
