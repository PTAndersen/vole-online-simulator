import { NextRequest, NextResponse } from 'next/server';
import jwt, { Secret } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;
const prisma = new PrismaClient();

async function verifyTokenAndCheckStudent(token: string): Promise<{ userId: number, role: string } | null> {
    try {
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined.');
        }
        const decoded = jwt.verify(token, JWT_SECRET as Secret) as any;
        if(decoded.role === 'STUDENT') {
            return { userId: decoded.userId, role: decoded.role };
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { classCode, exerciseId } = await request.json();
        const sessionToken = request.headers.get('authorization')?.split(' ')[1];

        if (!classCode || !exerciseId || !sessionToken) {
            return new NextResponse(JSON.stringify({ message: 'Class code, exercise ID, and/or authorization token are required' }), { status: 400 });
        }

        const user = await verifyTokenAndCheckStudent(sessionToken);
        if (!user) {
            return new NextResponse(JSON.stringify({ message: 'Unauthorized or invalid token' }), { status: 403 });
        }

        const assignment = await prisma.assignment.findFirst({
            where: {
                classroom: {
                    classCode: classCode
                },
                exerciseId: exerciseId,
                userId: user.userId
            }
        });

        if (!assignment) {
            return new NextResponse(JSON.stringify({ message: 'Assignment not found' }), { status: 404 });
        }

        const updatedAssignment = await prisma.assignment.update({
            where: {
                id: assignment.id
            },
            data: {
                status: 'COMPLETED'
            }
        });

        return new NextResponse(JSON.stringify({ message: 'Assignment completed successfully', assignment: updatedAssignment }), { status: 201 });
    } catch (error) {
        return new NextResponse(JSON.stringify({ message: 'Server error' }), { status: 500 });
    }
}
