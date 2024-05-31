import { POST } from '../../app/api/create-exercise/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    classroom: {
      findUnique: jest.fn(),
    },
    exercise: {
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
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

describe('POST /api/create-exercise', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new exercise and return the exercise data', async () => {
    const requestBody = {
      sessionToken: 'valid-session-token',
      classCode: 'class-code',
      name: 'Exercise Name',
      description: 'Exercise Description',
      randomCell: 'A1',
      resultCell: 'B2',
      resultValue: '100',
      cycleConstraint: 'constraint',
      mustUseInstructions: true,
    };

    const request = new NextRequest('http://localhost/api/create-exercise', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockResolvedValue({ id: 'class-id' });
    (mockPrisma.exercise.create as jest.Mock).mockResolvedValue({ id: 'exercise-id', ...requestBody, creatorId: 1, classroomId: 'class-id' });
    (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'student-id' }]);
    (mockPrisma.assignment.create as jest.Mock).mockResolvedValue({});

    const response = await POST(request);
    const responseBody = await response.json();

    const { sessionToken, ...filteredResponseBody } = responseBody;

    expect(response.status).toBe(201);
    expect(filteredResponseBody).toEqual({
      id: 'exercise-id',
      classCode: 'class-code',
      name: 'Exercise Name',
      description: 'Exercise Description',
      randomCell: 'A1',
      resultCell: 'B2',
      resultValue: '100',
      cycleConstraint: 'constraint',
      mustUseInstructions: true,
      creatorId: 1,
      classroomId: 'class-id',
    });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.classroom.findUnique).toHaveBeenCalledWith({
      where: { classCode: 'class-code' },
    });
    expect(mockPrisma.exercise.create).toHaveBeenCalledWith({
      data: {
        name: 'Exercise Name',
        description: 'Exercise Description',
        cycleConstraint: 'constraint',
        mustUseInstructions: true,
        randomCell: 'A1',
        resultCell: 'B2',
        resultValue: '100',
        creatorId: 1,
        classroomId: 'class-id',
      },
    });
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: {
        enrollments: {
          some: {
            id: 'class-id',
          },
        },
      },
    });
    expect(mockPrisma.assignment.create).toHaveBeenCalledWith({
      data: {
        exerciseId: 'exercise-id',
        userId: 'student-id',
        classroomId: 'class-id',
        status: 'UNCOMPLETED',
      },
    });
  });

  it('should return a 400 if class code is missing', async () => {
    const requestBody = {
      sessionToken: 'valid-session-token',
      name: 'Exercise Name',
      description: 'Exercise Description',
      randomCell: 'A1',
      resultCell: 'B2',
      resultValue: '100',
      cycleConstraint: 'constraint',
      mustUseInstructions: true,
    };

    const request = new NextRequest('http://localhost/api/create-exercise', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({ message: 'Class code is required' });
  });

  it('should return a 400 if required fields are missing', async () => {
    const requestBody = {
      sessionToken: 'valid-session-token',
      classCode: 'class-code',
      name: 'Exercise Name',
    };

    const request = new NextRequest('http://localhost/api/create-exercise', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody).toEqual({ message: 'Required fields are missing' });
  });

  it('should return a 403 if the session token is invalid or user is not a teacher', async () => {
    const requestBody = {
      sessionToken: 'invalid-session-token',
      classCode: 'class-code',
      name: 'Exercise Name',
      description: 'Exercise Description',
      randomCell: 'A1',
      resultCell: 'B2',
      resultValue: '100',
      cycleConstraint: 'constraint',
      mustUseInstructions: true,
    };

    const request = new NextRequest('http://localhost/api/create-exercise', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Token verification failed');
    });

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody).toEqual({ message: 'Unauthorized or invalid token' });
  });

  it('should return a 404 if the classroom is not found', async () => {
    const requestBody = {
      sessionToken: 'valid-session-token',
      classCode: 'class-code',
      name: 'Exercise Name',
      description: 'Exercise Description',
      randomCell: 'A1',
      resultCell: 'B2',
      resultValue: '100',
      cycleConstraint: 'constraint',
      mustUseInstructions: true,
    };

    const request = new NextRequest('http://localhost/api/create-exercise', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({ message: 'Classroom not found' });
  });

  it('should return a 500 if there is a server error', async () => {
    const requestBody = {
      sessionToken: 'valid-session-token',
      classCode: 'class-code',
      name: 'Exercise Name',
      description: 'Exercise Description',
      randomCell: 'A1',
      resultCell: 'B2',
      resultValue: '100',
      cycleConstraint: 'constraint',
      mustUseInstructions: true,
    };

    const request = new NextRequest('http://localhost/api/create-exercise', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ message: 'Server error' });
  });
});
