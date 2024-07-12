import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from './passportConfig'; // Подключение конфигурации passport.js для стратегии JWT
import routes from './routes'; // Эндпоинты API

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let secret: string | undefined = process.env.SESSION_SECRET;
if (secret !== undefined) {
    app.use(session({
        secret: secret, // Ключ для подписи сессионных cookie
        resave: false, // Не сохранять сессию, если она не изменилась
        saveUninitialized: false, // Сохранять новые и неинициализированные сессии
        cookie: { secure: process.env.NODE_ENV === 'production' } // Устанавливать secure cookie в продакшн среде
    }));
}

app.use(passport.initialize()); // Инициализация Passport.js
app.use(passport.session()); // Использование сессий Passport.js для авторизации

app.use('/api', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
