import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function registerUser(email: string, password: string, firstName: string, lastName: string): Promise<boolean> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return false; // User already exists
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    },
  });

  return true;
}

export const POST = async (request: NextRequest) => {
  try {
    const { email, password, firstName, lastName } = await request.json();

    if (!email || !password || !firstName || !lastName) {
      return new NextResponse(JSON.stringify({ message: 'Email, password, first name, and last name are required' }), { status: 400 });
    }

    const isRegistered = await registerUser(email, password, firstName, lastName);

    if (!isRegistered) {
      return new NextResponse(JSON.stringify({ message: 'User already exists' }), { status: 409 });
    }

    return new NextResponse(JSON.stringify({ message: 'Registration successful' }), { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return new NextResponse(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
};
