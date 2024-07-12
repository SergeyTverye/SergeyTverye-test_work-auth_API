import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';

// Инициализация клиента Prisma для взаимодействия с базой данных
const prisma = new PrismaClient();

// Настройки стратегии JWT
const opts: StrategyOptions = {
    // Извлечение JWT из заголовка Authorization в формате Bearer
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // Секретный ключ для подписи JWT из переменной окружения
    secretOrKey: process.env.JWT_SECRET as string,
};

// Конфигурация стратегии JWT для Passport.js
passport.use(
    new JwtStrategy(opts, async (jwt_payload: any, done: (error: any, user?: any, info?: any) => void) => {
        try {
            // Поиск пользователя в базе данных по ID, который был закодирован в JWT
            const user = await prisma.user.findUnique({
                where: { id: jwt_payload.id }
            });

            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        } catch (error) {
            return done(error, false);
        }
    })
);

export default passport;
