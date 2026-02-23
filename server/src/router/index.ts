// роутер на запись
// роутер на получение
// роутер на обновление

import { Router } from "express";
import {
  createPerson,
  getPersonById,
  getAllPersons,
  searchPersons,
  updatePerson,
  deletePerson,
} from "../controller/dataController.ts";

const router = Router();

// Базовые CRUD операции
router.post("/items", createPerson); // Создать
router.get("/items", getAllPersons); // Получить все
// router.get("/items/search", searchPersons); // Поиск
router.get("/items/:id", getPersonById); // Получить по ID
router.put("/items/:id", updatePerson); // Обновить
router.delete("/items/:id", deletePerson); // Удалить

export default router;
