import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const prisma = new PrismaClient();

export const DELETE = async (request: NextRequest) => {
    const sessionToken = request.headers.get('authorization')?.split(' ')[1];
    const { classCode } = await request.json();

    if (!sessionToken) {
        return new NextResponse(JSON.stringify({ message: 'Authorization token is required' }), { status: 401 });
    }

    const user = await verifyTokenAndGetUserRole(sessionToken);
    if (!user) {
        return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 403 });
    }

    if (user.role !== 'TEACHER') {
        return new NextResponse(JSON.stringify({ message: 'Only teachers can delete classes' }), { status: 403 });
    }

    const classroom = await prisma.classroom.findUnique({
        where: {
            classCode: classCode
        }
    });

    if (!classroom || classroom.teacherId !== user.userId) {
        return new NextResponse(JSON.stringify({ message: 'Class not found or you are not the owner of this class' }), { status: 404 });
    }

    try {
        await deleteClassroom(classroom.id);

        return new NextResponse(JSON.stringify({ message: 'Class deleted successfully' }), { status: 200, headers: {
            'Content-Type': 'application/json'
        } });
    } catch (error) {
        console.error('Error deleting class:', error);
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

async function deleteClassroom(classroomId: number): Promise<void> {
    await prisma.assignment.deleteMany({
        where: {
            classroomId: classroomId
        }
    });

    await prisma.exercise.deleteMany({
        where: {
            classroomId: classroomId
        }
    });

    await prisma.classroom.delete({
        where: {
            id: classroomId
        }
    });
}
