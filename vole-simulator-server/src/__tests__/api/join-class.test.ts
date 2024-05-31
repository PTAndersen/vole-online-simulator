import { POST } from '../../app/api/join-class/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    classroom: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    assignment: {
      create: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('jsonwebtoken');

const mockPrisma = new PrismaClient();
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('POST /api/join-class', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should join a class and create assignments', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/join-class', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
    (mockPrisma.classroom.findUnique as jest.Mock).mockResolvedValue({
      id: 'class-id',
      exercises: [{ id: 'exercise-id' }],
    });
    (mockPrisma.classroom.findFirst as jest.Mock).mockResolvedValue(null);
    (mockPrisma.classroom.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.assignment.create as jest.Mock).mockResolvedValue({});

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ message: 'Successfully joined classroom' });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.classroom.findUnique).toHaveBeenCalledWith({
      where: { classCode: 'class-code' },
      include: { exercises: true },
    });
    expect(mockPrisma.classroom.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'class-id',
        students: {
          some: {
            id: 1,
          },
        },
      },
    });
    expect(mockPrisma.classroom.update).toHaveBeenCalledWith({
      where: {
        id: 'class-id',
      },
      data: {
        students: {
          connect: {
            id: 1,
          },
        },
      },
    });
    expect(mockPrisma.assignment.create).toHaveBeenCalledWith({
      data: {
        exerciseId: 'exercise-id',
        userId: 1,
        classroomId: 'class-id',
        status: 'UNCOMPLETED',
      },
    });
  });

  it('should return a 400 if class code or authorization token is missing', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/join-class', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({ message: 'Class code and authorization token are required' });
  });

  it('should return a 403 if the session token is invalid or expired', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/join-class', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer invalid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Token verification failed');
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody).toEqual({ message: 'Invalid or expired token' });
  });

  it('should return a 404 if the classroom is not found', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/join-class', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
    (mockPrisma.classroom.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({ message: 'Failed to join the classroom or classroom not found' });
  });

  it('should return a 500 if there is a server error', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/join-class', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1 });
    (mockPrisma.classroom.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ message: 'Server error' });
  });
});
