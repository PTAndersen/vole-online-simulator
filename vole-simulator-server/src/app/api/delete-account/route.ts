import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const prisma = new PrismaClient();

export const DELETE = async (request: NextRequest) => {
    const sessionToken = request.headers.get('authorization')?.split(' ')[1];

    if (!sessionToken) {
        return new NextResponse(JSON.stringify({ message: 'Authorization token is required' }), { status: 401 });
    }

    const user = await verifyTokenAndGetUserRole(sessionToken);
    if (!user) {
        return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 403 });
    }

    try {
        if (user.role === 'STUDENT') {
            await deleteStudentAccount(user.userId);
        } else if (user.role === 'TEACHER') {
            await deleteTeacherAccount(user.userId);
        }

        return new NextResponse(JSON.stringify({ message: 'Account deleted successfully' }), { status: 200, headers: {
            'Content-Type': 'application/json'
        } });
    } catch (error) {
        console.error('Error deleting account:', error);
        return new NextResponse(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
};

async function verifyTokenAndGetUserRole(token: string): Promise<{ userId: number, role: string } | null> {
    try {
        const decoded = jwt.verify(token, JWT_SECRET as Secret) as any;
        return { userId: decoded.userId, role: decoded.role };
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

async function deleteStudentAccount(studentId: number): Promise<void> {
    await prisma.assignment.deleteMany({
        where: {
            userId: studentId
        }
    });

    await prisma.user.update({
        where: {
            id: studentId
        },
        data: {
            enrollments: {
                set: []
            }
        }
    });

    await prisma.user.delete({
        where: {
            id: studentId
        }
    });
}

async function deleteTeacherAccount(teacherId: number): Promise<void> {
    const classrooms = await prisma.classroom.findMany({
        where: {
            teacherId: teacherId
        }
    });

    const classroomIds = classrooms.map(classroom => classroom.id);

    await prisma.assignment.deleteMany({
        where: {
            classroomId: {
                in: classroomIds
            }
        }
    });

    await prisma.exercise.deleteMany({
        where: {
            classroomId: {
                in: classroomIds
            }
        }
    });

    await prisma.classroom.deleteMany({
        where: {
            id: {
                in: classroomIds
            }
        }
    });

    await prisma.user.delete({
        where: {
            id: teacherId
        }
    });
}
