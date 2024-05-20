import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt, { Secret } from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

async function verifyTokenAndCheckTeacher(token: string): Promise<number | null> {
    try {
        const decoded = jwt.verify(token, JWT_SECRET as Secret) as any;
        if(decoded.role === 'TEACHER') {
            return decoded.userId;
        } else {
            console.log('Access denied: User is not a teacher');
            return null;
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    const data = await request.json();
    const { sessionToken, classCode, name, description, randomCell, resultCell, resultValue, cycleConstraint, mustUseInstructions } = data;

    if (!classCode){
        return new NextResponse(JSON.stringify({ message: 'Class code is required' }), { status: 400 });
    }

    if (!sessionToken || !name || !description || !resultCell || !resultValue || !cycleConstraint || !mustUseInstructions) {
        return new NextResponse(JSON.stringify({ message: 'Required fields are missing' }), { status: 400 });
    }

    const userId = await verifyTokenAndCheckTeacher(sessionToken);
    if (!userId) {
        return new NextResponse(JSON.stringify({ message: 'Unauthorized or invalid token' }), { status: 403 });
    }

    try {
        const classroom = await prisma.classroom.findUnique({
            where: { classCode }
        });

        if (!classroom) {
            return new NextResponse(JSON.stringify({ message: 'Classroom not found' }), { status: 404 });
        }

        const newExercise = await prisma.exercise.create({
            data: {
                name,
                description,
                cycleConstraint,
                mustUseInstructions,
                randomCell,
                resultCell,
                resultValue,
                creatorId: userId,
                classroomId: classroom.id,
            }
        });

        const students = await prisma.user.findMany({
            where: {
                enrollments: {
                    some: {
                        id: classroom.id
                    }
                }
            }
        });

        await Promise.all(students.map(student =>
            prisma.assignment.create({
                data: {
                    exerciseId: newExercise.id,
                    userId: student.id,
                    classroomId: classroom.id,
                    status: "UNCOMPLETED"
                }
            })
        ));

        return new NextResponse(JSON.stringify(newExercise), { status: 201 });
    } catch (error) {
        console.error('Error creating exercise:', error);
        return new NextResponse(JSON.stringify({ message: 'Server error' }), { status: 500 });
    }
}
