import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { Secret } from 'jsonwebtoken';

interface ClassroomSummary {
    name: string;
    classCode: string;
}


const JWT_SECRET = process.env.JWT_SECRET;
const prisma = new PrismaClient();

export const GET = async (request: NextRequest) => {
    try {
        const sessionToken = request.headers.get('authorization')?.split(' ')[1];

        if (!sessionToken) {
            return new NextResponse(JSON.stringify({ message: 'Authorization token is required' }), { status: 401 });
        }

        const user = await verifyTokenAndGetUserRole(sessionToken);
        if (!user) {
            return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 403 });
        }

        let classrooms: ClassroomSummary[] = [];
        if (user.role === 'TEACHER') {
            classrooms = await getClassroomsByTeacherId(user.userId);
        } else if (user.role === 'STUDENT') {
            classrooms = await getClassroomsByStudentId(user.userId);
        }

        return new NextResponse(JSON.stringify({ classrooms }), { status: 200, headers: {
            'Content-Type': 'application/json'
        } });
    } catch (error) {
        return new NextResponse(JSON.stringify({ message: 'Server error' }), { status: 500 });
    }
};

async function verifyTokenAndGetUserRole(token: string): Promise<{userId: number, role: string} | null> {
    try {
        const decoded = jwt.verify(token, JWT_SECRET as Secret) as any;
        return { userId: decoded.userId, role: decoded.role };
    } catch (error) {
        return null;
    }
}


async function getClassroomsByTeacherId(teacherId: number): Promise<ClassroomSummary[]> {
    const classrooms = await prisma.classroom.findMany({
        where: {
            teacherId: teacherId
        },
        select: {
            name: true,
            classCode: true
        }
    });
    return classrooms;
}


async function getClassroomsByStudentId(studentId: number): Promise<ClassroomSummary[]> {
    const userWithClassrooms = await prisma.user.findUnique({
        where: {
            id: studentId
        },
        include: {
            enrollments: {
                select: {
                    name: true,
                    classCode: true
                }
            }
        }
    });

    return userWithClassrooms ? userWithClassrooms.enrollments : [];
}


