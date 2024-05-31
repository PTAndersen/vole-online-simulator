import { POST } from '../../app/api/login/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPrisma = new PrismaClient();
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('POST /api/login', () => {
  beforeAll(() => {
    // Pass
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login a user and return a token', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
    };

    const request = new NextRequest('http://localhost/api/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'STUDENT',
    });
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockJwt.sign as jest.Mock).mockReturnValue('mocked-jwt-token');

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      message: 'Login successful',
      token: 'mocked-jwt-token',
      role: 'STUDENT',
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
    expect(mockJwt.sign).toHaveBeenCalledWith(
      { userId: 'user-id', email: 'test@example.com', role: 'STUDENT' },
      'yoursecretkey',
      { expiresIn: '24h' }
    );
  });

  it('should return a 400 if email or password is missing', async () => {
    const requestBody = {
      email: 'test@example.com',
    };

    const request = new NextRequest('http://localhost/api/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({ message: 'Email and password are required' });
  });

  it('should return a 401 if email or password is invalid', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    const request = new NextRequest('http://localhost/api/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'STUDENT',
    });
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody).toEqual({ message: 'Invalid email or password' });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
  });

  it('should return a 500 if there is a server error', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
    };

    const request = new NextRequest('http://localhost/api/login', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockPrisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ message: 'Server error' });
  });
});
