import { POST } from '../../app/api/create-class/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    classroom: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('jsonwebtoken');
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(),
}));

const mockPrisma = new PrismaClient();
const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockRandomBytes = randomBytes as jest.Mock;

describe('POST /api/create-class', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new classroom and return the class ID', async () => {
    const requestBody = {
      sessionToken: 'valid-session-token',
      className: 'Test Class',
    };

    const request = new NextRequest('http://localhost/api/create-class', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const randomClassCodeBuffer = Buffer.from('randomclasscode');
    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findFirst as jest.Mock).mockResolvedValue(null);
    (mockRandomBytes as jest.Mock).mockReturnValue(randomClassCodeBuffer);
    (mockPrisma.classroom.create as jest.Mock).mockResolvedValue({
      id: 'class-id',
      name: 'Test Class',
      classCode: randomClassCodeBuffer.toString('hex'),
      teacherId: 1,
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(201);
    expect(responseBody).toEqual({
      message: 'Classroom created successfully',
      classId: 'class-id',
    });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.classroom.findFirst).toHaveBeenCalledWith({
      where: {
        name: 'Test Class',
        teacherId: 1,
      },
    });
    expect(mockRandomBytes).toHaveBeenCalledWith(6);
    expect(mockPrisma.classroom.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Class',
        classCode: randomClassCodeBuffer.toString('hex'),
        teacherId: 1,
      },
    });
  });

  it('should return a 400 if session token or class name is missing', async () => {
    const requestBody = {
      className: 'Test Class',
    };

    const request = new NextRequest('http://localhost/api/create-class', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({ message: 'Session token and class name are required' });
  });

  it('should return a 403 if the session token is invalid or expired', async () => {
    const requestBody = {
      sessionToken: 'invalid-session-token',
      className: 'Test Class',
    };

    const request = new NextRequest('http://localhost/api/create-class', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Token verification failed');
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody).toEqual({ message: 'Invalid or expired token' });
    expect(mockJwt.verify).toHaveBeenCalledWith('invalid-session-token', process.env.JWT_SECRET);
  });

  // TODO: 409 test

  it('should return a 500 if there is a server error', async () => {
    const requestBody = {
      sessionToken: 'valid-session-token',
      className: 'Test Class',
    };

    const request = new NextRequest('http://localhost/api/create-class', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ message: 'Server error' });
  });
});
