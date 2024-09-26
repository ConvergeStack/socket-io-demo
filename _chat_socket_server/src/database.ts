import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserFromDatabase = async (username: string) => {
    const user = await prisma.user.findFirst({
        where: {
            username,
        },
    });

    if (!user) {
        const newUser = await prisma.user.create({
            data: {
                username,
            },
        });
        return newUser;
    }

    return user;
};

export const insertMessageIntoDatabase = async (senderId: string, receiverId: string, messageText: string) => {
    await prisma.message.create({
        data: {
            content: JSON.stringify({
                v: 1,
                text: messageText
            }),
            senderId,
            receiverId,
        },
    });
};