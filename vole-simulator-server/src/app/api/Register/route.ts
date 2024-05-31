import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';

const prisma = new PrismaClient();

async function registerUser(email: string, password: string, firstName: string, lastName: string, role: string): Promise<string | false> {
  if (!['STUDENT', 'TEACHER'].includes(role.toUpperCase())) {
    throw new Error('Invalid role specified. Must be either STUDENT or TEACHER.');
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    return false;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role.toUpperCase(),
    },
  });

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined. Please check your .env file or environment settings.');
  }

  const payload = {
      userId: user.id,
      email: email,
      role: role.toUpperCase()
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
}

export const POST = async (request: NextRequest) => {
  try {
    const { email, password, firstName, lastName, role } = await request.json();

    if (!email || !password || !firstName || !lastName || !role) {
      return new NextResponse(JSON.stringify({ message: 'Email, password, first name, last name, and role are required' }), { status: 400 });
    }

    const result = await registerUser(email, password, firstName, lastName, role);

    if (result === false) {
      return new NextResponse(JSON.stringify({ message: 'User already exists' }), { status: 409 });
    }

    return new NextResponse(JSON.stringify({ message: 'Registration successful', token: result , role: role.toUpperCase()}), { status: 201, headers: {
      'Content-Type': 'application/json'
    } });
  } catch (error) {
    return new NextResponse(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
};
