import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:3000/api';
const prisma = new PrismaClient();

const users = [
    { email: 'user1@example.com', password: 'password1', name: 'User 1' },
    { email: 'user2@example.com', password: 'password2', name: 'User 2' },
    { email: 'user3@example.com', password: 'password3', name: 'User 3' },
];

let token: string = '';
let userList: any[] = [];

async function clearDatabase() {
    try {
        await prisma.user.deleteMany({});
        console.log('Очистка базы данных.');
    } catch (error) {
        console.error('Ошибка при очистке базы данных:', error);
    }
}

async function registerUsers() {
    for (const user of users) {
        try {
            const response = await axios.post(`${API_URL}/register`, user);
            console.log(`Пользователь зарегистрирован: ${response.data.email}`);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`Ошибка регистрации ${user.email}:`, error.response?.data);
            } else {
                console.error(`Ошибка регистрации  ${user.email}:`, error);
            }
        }
    }
}

async function loginUser() {
    try {
        const response = await axios.post(`${API_URL}/login`, { email: 'user1@example.com', password: 'password1' });
        token = response.data.token;
        console.log('Пользователь user1@example.com авторизован и получил токен:', token);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Ошибка авторизации:', error.response?.data);
        } else {
            console.error('Ошибка авторизации:', error);
        }
    }
}

async function getUsers() {
    try {
        const response = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        userList = response.data;
        console.log(userList);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Ошибка получения списка пользователей:', error.response?.data);
        } else {
            console.error('Ошибка получения списка пользователей:', error);
        }
    }
}

async function updateUser(userId: number, updatedData: { email?: string, name?: string }) {
    try {
        const response = await axios.put(`${API_URL}/users/${userId}`, updatedData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Обновление данных пользователя ${userId}:`, response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Ошибка обновлениях данных пользователя ${userId}:`, error.response?.data);
        } else {
            console.error(`Ошибка обновлениях данных пользователя ${userId}:`, error);
        }
    }
}

async function deleteUser(userId: number) {
    try {
        await axios.delete(`${API_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Удаление пользователя ${userId}`);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Ошибка при удалении пользователя ${userId}:`, error.response?.data);
        } else {
            console.error(`Ошибка при удалении пользователя ${userId}:`, error);
        }
    }
}

async function runTests() {
    // Очистка базы данных перед проведением тестов
    await clearDatabase();

    await registerUsers();

    // Авторизация под пользователем user1@example.com для выполнения последующих операций
    await loginUser();

    console.log('Проверяем список зарегистрированных пользователей:');
    await getUsers();

    if (userList.length > 0) {
        const userIdToUpdate = userList[0].id;

        await updateUser(userIdToUpdate, { email: 'updateduser1@example.com', name: 'Обновленный User 1' });

        console.log('Список пользователей после обновления:');
        await getUsers();

        if (userList.length > 1) {
            const userIdToDelete = userList[1].id;

            await deleteUser(userIdToDelete);

            console.log('Список пользователей после удаления:');
            await getUsers();
        }
    }

    // Очистка базы данных после тестирования
    await clearDatabase();
}

runTests()
    .catch(error => {
        if (axios.isAxiosError(error)) {
            console.error('Ошибка при запуске тестов:', error.response?.data);
        } else {
            console.error('Ошибка при запуске тестов:', error);
        }
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
