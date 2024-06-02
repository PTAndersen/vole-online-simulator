import { DELETE } from '../../app/api/delete-classroom/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    classroom: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    assignment: {
      deleteMany: jest.fn(),
    },
    exercise: {
      deleteMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

jest.mock('jsonwebtoken');

const mockPrisma = new PrismaClient();
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('DELETE /api/delete-classroom', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a class and return a success message', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/delete-classroom', {
      method: 'DELETE',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockResolvedValue({
      id: 'class-id',
      teacherId: 1,
    });
    (mockPrisma.assignment.deleteMany as jest.Mock).mockResolvedValue({});
    (mockPrisma.exercise.deleteMany as jest.Mock).mockResolvedValue({});
    (mockPrisma.classroom.delete as jest.Mock).mockResolvedValue({});

    const response = await DELETE(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ message: 'Class deleted successfully' });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.classroom.findUnique).toHaveBeenCalledWith({
      where: { classCode: 'class-code' },
    });
    expect(mockPrisma.assignment.deleteMany).toHaveBeenCalledWith({
      where: { classroomId: 'class-id' },
    });
    expect(mockPrisma.exercise.deleteMany).toHaveBeenCalledWith({
      where: { classroomId: 'class-id' },
    });
    expect(mockPrisma.classroom.delete).toHaveBeenCalledWith({
      where: { id: 'class-id' },
    });
  });

  it('should return a 401 if authorization token is missing', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/delete-classroom', {
      method: 'DELETE',
      body: JSON.stringify(requestBody),
    });

    const response = await DELETE(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody).toEqual({ message: 'Authorization token is required' });
  });

  it('should return a 403 if the session token is invalid or expired', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/delete-classroom', {
      method: 'DELETE',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer invalid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Token verification failed');
    });

    const response = await DELETE(request);
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody).toEqual({ message: 'Invalid or expired token' });
  });

  it('should return a 403 if the user is not a teacher', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/delete-classroom', {
      method: 'DELETE',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'STUDENT' });

    const response = await DELETE(request);
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody).toEqual({ message: 'Only teachers can delete classes' });
  });

  it('should return a 404 if the class is not found or the user is not the owner', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/delete-classroom', {
      method: 'DELETE',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await DELETE(request);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody).toEqual({ message: 'Class not found or you are not the owner of this class' });
  });

  it('should return a 500 if there is a server error', async () => {
    const requestBody = {
      classCode: 'class-code',
    };

    const request = new NextRequest('http://localhost/api/delete-classroom', {
      method: 'DELETE',
      body: JSON.stringify(requestBody),
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });
    (mockPrisma.classroom.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await DELETE(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ message: 'Server error' });
  });
});
