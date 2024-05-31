import { POST } from '../../app/api/register/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});


jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockPrisma = new PrismaClient();
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('POST /api/register', () => {
  beforeAll(() => {
    // pass
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user and return a token', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'STUDENT',
    };

    const request = new NextRequest('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockBcrypt.genSalt as jest.Mock).mockResolvedValue('somesalt');
    (mockBcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (mockPrisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'STUDENT',
    });
    (mockJwt.sign as jest.Mock).mockReturnValue('mocked-jwt-token');

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(201);
    expect(responseBody).toEqual({
      message: 'Registration successful',
      token: 'mocked-jwt-token',
      role: 'STUDENT',
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(mockBcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 'somesalt');
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
      },
    });
    expect(mockJwt.sign).toHaveBeenCalledWith(
      { userId: 'user-id', email: 'test@example.com', role: 'STUDENT' },
      'yoursecretkey',
      { expiresIn: '24h' }
    );
  });

  it('should return a 409 if user already exists', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'STUDENT',
    };

    const request = new NextRequest('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-user-id' });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(409);
    expect(responseBody).toEqual({ message: 'User already exists' });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
  });

  it('should return a 400 if required fields are missing', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
    };

    const request = new NextRequest('http://localhost/api/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      message: 'Email, password, first name, last name, and role are required',
    });
  });

  it('should return a 500 if there is a server error', async () => {
    const requestBody = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'STUDENT',
    };

    const request = new NextRequest('http://localhost/api/register', {
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
