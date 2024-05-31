import { DELETE } from '../../app/api/delete-account/route';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      delete: jest.fn(),
      update: jest.fn(),
    },
    assignment: {
      deleteMany: jest.fn(),
    },
    classroom: {
      findMany: jest.fn(),
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

describe('DELETE /api/delete-account', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a student account and return a success message', async () => {
    const request = new NextRequest('http://localhost/api/delete-account', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'STUDENT' });

    const response = await DELETE(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ message: 'Account deleted successfully' });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.assignment.deleteMany).toHaveBeenCalledWith({
      where: { userId: 1 },
    });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { enrollments: { set: [] } },
    });
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('should delete a teacher account and return a success message', async () => {
    const request = new NextRequest('http://localhost/api/delete-account', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'TEACHER' });

    (mockPrisma.classroom.findMany as jest.Mock).mockResolvedValue([
      { id: 'class-id-1' },
      { id: 'class-id-2' },
    ]);

    const response = await DELETE(request);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual({ message: 'Account deleted successfully' });
    expect(mockJwt.verify).toHaveBeenCalledWith('valid-session-token', process.env.JWT_SECRET);
    expect(mockPrisma.classroom.findMany).toHaveBeenCalledWith({
      where: { teacherId: 1 },
    });
    expect(mockPrisma.assignment.deleteMany).toHaveBeenCalledWith({
      where: { classroomId: { in: ['class-id-1', 'class-id-2'] } },
    });
    expect(mockPrisma.exercise.deleteMany).toHaveBeenCalledWith({
      where: { classroomId: { in: ['class-id-1', 'class-id-2'] } },
    });
    expect(mockPrisma.classroom.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['class-id-1', 'class-id-2'] } },
    });
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('should return a 401 if authorization token is missing', async () => {
    const request = new NextRequest('http://localhost/api/delete-account', {
      method: 'DELETE',
    });

    const response = await DELETE(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody).toEqual({ message: 'Authorization token is required' });
  });

  it('should return a 403 if the session token is invalid or expired', async () => {
    const request = new NextRequest('http://localhost/api/delete-account', {
      method: 'DELETE',
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

  it('should return a 500 if there is a server error', async () => {
    const request = new NextRequest('http://localhost/api/delete-account', {
      method: 'DELETE',
      headers: {
        authorization: 'Bearer valid-session-token',
      },
    });

    (mockJwt.verify as jest.Mock).mockReturnValue({ userId: 1, role: 'STUDENT' });
    (mockPrisma.assignment.deleteMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    const response = await DELETE(request);
    const responseBody = await response.json();

    expect(response.status).toBe(500);
    expect(responseBody).toEqual({ message: 'Server error' });
  });
});
