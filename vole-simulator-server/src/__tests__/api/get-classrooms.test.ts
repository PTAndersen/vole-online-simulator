import { GET } from '../../app/api/get-classrooms/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    classroom: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('jsonwebtoken');

const mockPrisma = new PrismaClient();
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('GET /api/get-classrooms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return classrooms for a teacher', async () => {
    const request = new NextRequest('http://localhost/api/get-classrooms', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findMany as jest.Mock).mockResolvedValue([
      { name: 'Classroom 1', classCode: 'code1' },
      { name: 'Classroom 2', classCode: 'code2' },
    ]);

    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      classrooms: [
        { name: 'Classroom 1', classCode: 'code1' },
        { name: 'Classroom 2', classCode: 'code2' },
      ],
    });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.classroom.findMany).toHaveBeenCalledWith({
      where: { teacherId: 1 },
      select: { name: true, classCode: true },
    });
  });

  it('should return classrooms for a student', async () => {
    const request = new NextRequest('http://localhost/api/get-classrooms', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'STUDENT' });
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      enrollments: [
        { name: 'Classroom 1', classCode: 'code1' },
        { name: 'Classroom 2', classCode: 'code2' },
      ],
    });

    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      classrooms: [
        { name: 'Classroom 1', classCode: 'code1' },
        { name: 'Classroom 2', classCode: 'code2' },
      ],
    });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { enrollments: { select: { name: true, classCode: true } } },
    });
  });

  it('should return a 401 if authorization token is missing', async () => {
    const request = new NextRequest('http://localhost/api/get-classrooms', {
      method: 'GET',
    });

    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody).toEqual({ message: 'Authorization token is required' });
  });

  it('should return a 403 if the session token is invalid or expired', async () => {
    const request = new NextRequest('http://localhost/api/get-classrooms', {
      method: 'GET',
      headers: {
        authorization: 'Bearer invalid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Token verification failed');
    });

    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody).toEqual({ message: 'Invalid or expired token' });
  });

  it('should return an empty array if the user is not a teacher or student', async () => {
    const request = new NextRequest('http://localhost/api/get-classrooms', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'ADMIN' });

    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ classrooms: [] });
  });

  it('should return a 500 if there is a server error', async () => {
    const request = new NextRequest('http://localhost/api/get-classrooms', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await GET(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ message: 'Server error' });
  });
});
