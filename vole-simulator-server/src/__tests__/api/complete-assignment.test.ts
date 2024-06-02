import { POST } from '../../app/api/complete-assignment/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    assignment: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('jsonwebtoken');

const mockPrisma = new PrismaClient();
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('POST /api/complete-assignment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete an assignment and return the updated assignment data', async () => {
    const requestBody = {
      classCode: 'class-code',
      exerciseId: 'exercise-id',
    };

    const request = new NextRequest('http://localhost/api/complete-assignment', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'STUDENT' });
    (mockPrisma.assignment.findFirst as jest.Mock).mockResolvedValue({ id: 'assignment-id', status: 'UNCOMPLETED' });
    (mockPrisma.assignment.update as jest.Mock).mockResolvedValue({ id: 'assignment-id', status: 'COMPLETED' });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(201);
    expect(responseBody).toEqual({
      message: 'Assignment completed successfully',
      assignment: { id: 'assignment-id', status: 'COMPLETED' },
    });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.assignment.findFirst).toHaveBeenCalledWith({
      where: {
        classroom: {
          classCode: 'class-code',
        },
        exerciseId: 'exercise-id',
        userId: 1,
      },
    });
    expect(mockPrisma.assignment.update).toHaveBeenCalledWith({
      where: {
        id: 'assignment-id',
      },
      data: {
        status: 'COMPLETED',
      },
    });
  });

  it('should return a 400 if class code, exercise ID, or authorization token are missing', async () => {
    const requestBody = {
      classCode: 'class-code',
      exerciseId: 'exercise-id',
    };

    const request = new NextRequest('http://localhost/api/complete-assignment', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({ message: 'Class code, exercise ID, and/or authorization token are required' });
  });

  it('should return a 403 if the session token is invalid or user is not a student', async () => {
    const requestBody = {
      classCode: 'class-code',
      exerciseId: 'exercise-id',
    };

    const request = new NextRequest('http://localhost/api/complete-assignment', {
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
    expect(responseBody).toEqual({ message: 'Unauthorized or invalid token' });
  });

  it('should return a 404 if the assignment is not found', async () => {
    const requestBody = {
      classCode: 'class-code',
      exerciseId: 'exercise-id',
    };

    const request = new NextRequest('http://localhost/api/complete-assignment', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'STUDENT' });
    (mockPrisma.assignment.findFirst as jest.Mock).mockResolvedValue(null);

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({ message: 'Assignment not found' });
  });

  it('should return a 500 if there is a server error', async () => {
    const requestBody = {
      classCode: 'class-code',
      exerciseId: 'exercise-id',
    };

    const request = new NextRequest('http://localhost/api/complete-assignment', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'STUDENT' });
    (mockPrisma.assignment.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ message: 'Server error' });
  });
});
