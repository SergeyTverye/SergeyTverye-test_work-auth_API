import { Router, Request, Response } from 'express';
import passport from 'passport';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();

// Регистрация пользователя
router.post('/register', [
    // Валидация
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').not().isEmpty()
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Хэшируем пароль

    try {
        const user = await prisma.user.create({ // Создаем пользователя в базе данных
            data: {
                email,
                password: hashedPassword,
                name
            }
        });
        res.json(user);
    } catch (error) {
        console.error('Ошибка при создании пользователя:', error);
        res.status(500).json({ error: 'Ошибка при создании пользователя' });
    }
});

// Аутентификация пользователя
router.post('/login', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }

        // Создаем токен доступа для пользователя сроком на 1 час
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
            expiresIn: '1h'
        });

        res.json({ token });
    } catch (error) {
        console.error('Ошибка при аутентификации:', error);
        res.status(500).json({ error: 'Ошибка при аутентификации' });
    }
});

// Получение списка пользователей
router.get('/users', passport.authenticate('jwt', { session: false }), async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        console.error('Ошибка при получении списка пользователей:', error);
        res.status(500).json({ error: 'Ошибка при получении списка пользователей' });
    }
});

// Обновление информации о пользователе
router.put('/users/:id', passport.authenticate('jwt', { session: false }), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, name } = req.body;

    try {
        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: { email, name }
        });
        res.json(user);
    } catch (error) {
        console.error(`Ошибка при обновлении пользователя ${id}:`, error);
        res.status(500).json({ error: 'Ошибка при обновлении пользователя' });
    }
});

// Удаление пользователя
router.delete('/users/:id', passport.authenticate('jwt', { session: false }), async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.user.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Пользователь удален' });
    } catch (error) {
        console.error(`Ошибка при удалении пользователя ${id}:`, error);
        res.status(500).json({ error: 'Ошибка при удалении пользователя' });
    }
});

export default router;
