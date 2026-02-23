import express from "express";
import type { Application } from "express";
import router from "./router/index.ts";
import { initDatabaseFile } from "./utils/fileHelper.ts";

const app: Application = express();
const port = 3000;

// Инициализация файла базы данных при запуске
await initDatabaseFile();

// Middleware
app.use(express.json()); // для парсинга JSON тела запроса
app.use(express.urlencoded({ extended: true })); // для парсинга form-data

// Роуты
app.use("/api", router);

// Обработка ошибок 404
app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

// Глобальный обработчик ошибок
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: "Что-то пошло не так!" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Данные сохраняются в data/database.txt`);
});
