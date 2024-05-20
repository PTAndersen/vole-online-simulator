import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const prisma = new PrismaClient();

async function joinClass(classCode: string, studentId: number): Promise<boolean> {
    const classroom = await prisma.classroom.findUnique({
        where: { classCode },
        include: {
            exercises: true
        }
    });

    if (!classroom) {
        console.error('Classroom not found');
        return false;
    }

    const isEnrolled = await prisma.classroom.findFirst({
        where: {
            id: classroom.id,
            students: {
                some: {
                    id: studentId
                }
            }
        }
    });

    if (isEnrolled) {
        console.error('Student already enrolled in classroom');
        return false;
    }

    await prisma.classroom.update({
        where: {
            id: classroom.id
        },
        data: {
            students: {
                connect: {
                    id: studentId
                }
            }
        }
    });

    // Create assignments for each exercise in the classroom
    await Promise.all(classroom.exercises.map(exercise =>
        prisma.assignment.create({
            data: {
                exerciseId: exercise.id,
                userId: studentId,
                classroomId: classroom.id,
                status: "UNCOMPLETED"
            }
        })
    ));

    return true;
}

export const POST = async (request: NextRequest) => {
    const data = await request.json();
    const { classCode } = data;
    const sessionToken = request.headers.get('authorization')?.split(' ')[1];

    if (!classCode || !sessionToken) {
        return new NextResponse(JSON.stringify({ message: 'Class code and authorization token are required' }), { status: 400 });
    }

    const studentId = await verifyTokenAndGetStudentId(sessionToken);
    if (!studentId) {
        return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 403 });
    }

    const success = await joinClass(classCode, studentId);
    if (!success) {
        return new NextResponse(JSON.stringify({ message: 'Failed to join the classroom or classroom not found' }), { status: 404 });
    }

    return new NextResponse(JSON.stringify({ message: 'Successfully joined classroom' }), { status: 200, headers: {
        'Content-Type': 'application/json'
    } });
};

async function verifyTokenAndGetStudentId(token: string): Promise<number | null> {
    try {
        const decoded = jwt.verify(token, JWT_SECRET as Secret) as any;
        return decoded.userId;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}
