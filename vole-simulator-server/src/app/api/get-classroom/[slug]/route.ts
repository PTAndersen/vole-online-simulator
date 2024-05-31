import { NextRequest, NextResponse } from 'next/server';
import jwt, { Secret } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;
const prisma = new PrismaClient();

async function verifyTokenAndGetUserRole(token: string): Promise<{ userId: number, role: string } | null> {
    try {
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined.');
        }
        const decoded = jwt.verify(token, JWT_SECRET as Secret) as any;
        return { userId: decoded.userId, role: decoded.role };
    } catch (error) {
        return null;
    }
}

export const GET = async (request: NextRequest, { params }: { params: { slug: string } }) => {
    try {
        const classCode = params["slug"];
        const sessionToken = request.headers.get('authorization')?.split(' ')[1];

        if (!classCode) {
            return new NextResponse(JSON.stringify({ message: 'Class code is required' }), { status: 400 });
        }

        if (!sessionToken) {
            return new NextResponse(JSON.stringify({ message: 'Authorization token is required' }), { status: 401 });
        }

        const user = await verifyTokenAndGetUserRole(sessionToken);
        if (!user) {
            return new NextResponse(JSON.stringify({ message: 'Invalid or expired token' }), { status: 403 });
        }

        let classroom;
        if (user.role === 'TEACHER') {
            classroom = await prisma.classroom.findUnique({
                where: { classCode },
                include: {
                    students: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    exercises: true
                }
            });
        } else if (user.role === 'STUDENT') {
            classroom = await prisma.classroom.findUnique({
                where: { classCode },
                include: {
                    students: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    },
                    assignments: {
                        where: { userId: user.userId },
                        include: {
                            exercise: true
                        }
                    }
                }
            });
        }
    
        if (!classroom) {
            return new NextResponse(JSON.stringify({ message: 'Classroom not found' }), { status: 404 });
        }

        if (user.role === 'TEACHER' && classroom.teacherId !== user.userId) {
            return new NextResponse(JSON.stringify({ message: 'You are not the teacher of this classroom' }), { status: 403 });
        }

        return new NextResponse(JSON.stringify(classroom), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        return new NextResponse(JSON.stringify({ message: 'Server error' }), { status: 500 });
    }
    
}
