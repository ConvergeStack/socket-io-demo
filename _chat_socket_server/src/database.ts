import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

export const getUserFromDatabase = async (username: string) => {
    const user = await prisma.user.findFirst({
        where: {
            username,
        },
    });

    return user;
};

export const createUserInDatabase = async (username: string) => {
    const newUser = await prisma.user.create({
        data: {
            username,
        },
    });

    return newUser;
};

export const insertMessageIntoDatabase = async (id: string, senderId: string, receiverId: string, messageText: string) => {
    await prisma.message.create({
        data: {
            id,
            content: JSON.stringify({
                v: 1,
                text: messageText
            }),
            senderId,
            receiverId,
        },
    });
};

export const getMessagesFromDatabase = async (senderId: string, receiverId: string, cursor: string | null, limit: number) => {
    const messages = await prisma.message.findMany({
        where: {
            OR: [
                {
                    AND: [
                        { senderId },
                        { receiverId }
                    ]
                },
                {
                    AND: [
                        { senderId: receiverId },
                        { receiverId: senderId }
                    ]
                }
            ]
        },
        orderBy: {
            id: 'desc'
        },
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        take: limit,
        include: {
            sender: {
                select: {
                    id: true,
                    username: true
                }
            },
            receiver: {
                select: {
                    id: true,
                    username: true
                }
            }
        }
    });

    return messages;
};
