import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import jwt, { Secret } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined. Please check your .env file or environment settings.');
}

const prisma = new PrismaClient();

async function verifyTokenAndCheckTeacher(token: string): Promise<number | null> {
    try {
        const decoded = jwt.verify(token, JWT_SECRET as Secret) as any;
        if(decoded.role === 'TEACHER') {
            return decoded.userId;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

async function createClassroom(name: string, teacherId: number): Promise<string | false> {
    const existingClassroom = await prisma.classroom.findFirst({
        where: {
            name,
            teacherId
        },
    });

    if (existingClassroom) {
        return false;
    }

    const classCode = randomBytes(6).toString('hex');
    const classroom = await prisma.classroom.create({
        data: {
            name,
            classCode,
            teacherId,
        },
    });

    return classroom.id.toString();
}

export const POST = async (request: NextRequest) => {
    try {
        const { sessionToken, className } = await request.json();

        if (!sessionToken || !className) {
            return new NextResponse(JSON.stringify({ message: 'Session token and class name are required' }), { status: 400 });
        }

        const teacherId = await verifyTokenAndCheckTeacher(sessionToken);
        if (!teacherId) {
            return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 403 });
        }

        const result = await createClassroom(className, teacherId);

        if (result === false) {
            return new NextResponse(JSON.stringify({ message: 'Classroom already exists' }), { status: 409 });
        }

        return new NextResponse(JSON.stringify({ message: 'Classroom created successfully', classId: result }), { status: 201, headers: {
            'Content-Type': 'application/json'
        } });
    } catch (error) {
        return new NextResponse(JSON.stringify({ message: 'Server error' }), { status: 500 });
    }
};
