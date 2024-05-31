import { GET } from '../../../app/api/get-classroom/[slug]/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    classroom: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('jsonwebtoken');

const mockPrisma = new PrismaClient();
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('GET /api/get-classroom/[slug]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return classroom details for a teacher', async () => {
    const request = new NextRequest('http://localhost/api/get-classroom/class-code', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    const params = { slug: 'class-code' };

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockResolvedValue({
      id: 'class-id',
      teacherId: 1,
      students: [
        { id: 'student-id-1', firstName: 'John', lastName: 'Doe' },
        { id: 'student-id-2', firstName: 'Jane', lastName: 'Doe' },
      ],
      exercises: [{ id: 'exercise-id-1', name: 'Exercise 1' }],
    });

    const response = await GET(request, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      id: 'class-id',
      teacherId: 1,
      students: [
        { id: 'student-id-1', firstName: 'John', lastName: 'Doe' },
        { id: 'student-id-2', firstName: 'Jane', lastName: 'Doe' },
      ],
      exercises: [{ id: 'exercise-id-1', name: 'Exercise 1' }],
    });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.classroom.findUnique).toHaveBeenCalledWith({
      where: { classCode: 'class-code' },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        exercises: true,
      },
    });
  });

  it('should return classroom details for a student', async () => {
    const request = new NextRequest('http://localhost/api/get-classroom/class-code', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    const params = { slug: 'class-code' };

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 2, role: 'STUDENT' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockResolvedValue({
      id: 'class-id',
      students: [
        { id: 'student-id-1', firstName: 'John', lastName: 'Doe' },
        { id: 'student-id-2', firstName: 'Jane', lastName: 'Doe' },
      ],
      assignments: [
        {
          id: 'assignment-id-1',
          status: 'COMPLETED',
          exercise: { id: 'exercise-id-1', name: 'Exercise 1' },
        },
      ],
    });

    const response = await GET(request, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      id: 'class-id',
      students: [
        { id: 'student-id-1', firstName: 'John', lastName: 'Doe' },
        { id: 'student-id-2', firstName: 'Jane', lastName: 'Doe' },
      ],
      assignments: [
        {
          id: 'assignment-id-1',
          status: 'COMPLETED',
          exercise: { id: 'exercise-id-1', name: 'Exercise 1' },
        },
      ],
    });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.classroom.findUnique).toHaveBeenCalledWith({
      where: { classCode: 'class-code' },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignments: {
          where: { userId: 2 },
          include: {
            exercise: true,
          },
        },
      },
    });
  });

  it('should return a 400 if class code is missing', async () => {
    const request = new NextRequest('http://localhost/api/get-classroom/', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    const params = { slug: '' };

    const response = await GET(request, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({ message: 'Class code is required' });
  });

  it('should return a 401 if authorization token is missing', async () => {
    const request = new NextRequest('http://localhost/api/get-classroom/class-code', {
      method: 'GET',
    });

    const params = { slug: 'class-code' };

    const response = await GET(request, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody).toEqual({ message: 'Authorization token is required' });
  });

  it('should return a 403 if the session token is invalid or expired', async () => {
    const request = new NextRequest('http://localhost/api/get-classroom/class-code', {
      method: 'GET',
      headers: {
        authorization: 'Bearer invalid-session-token',
      },
    });

    const params = { slug: 'class-code' };

    (mockJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Token verification failed');
    });

    const response = await GET(request, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody).toEqual({ message: 'Invalid or expired token' });
  });

  it('should return a 404 if the classroom is not found', async () => {
    const request = new NextRequest('http://localhost/api/get-classroom/class-code', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    const params = { slug: 'class-code' };

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await GET(request, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({ message: 'Classroom not found' });
  });

  it('should return a 403 if the teacher is not the owner of the classroom', async () => {
    const request = new NextRequest('http://localhost/api/get-classroom/class-code', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    const params = { slug: 'class-code' };

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockResolvedValue({
      id: 'class-id',
      teacherId: 2,
      students: [],
      exercises: [],
    });

    const response = await GET(request, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody).toEqual({ message: 'You are not the teacher of this classroom' });
  });

  it('should return a 500 if there is a server error', async () => {
    const request = new NextRequest('http://localhost/api/get-classroom/class-code', {
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    const params = { slug: 'class-code' };

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await GET(request, { params });
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ message: 'Server error' });
  });
});
