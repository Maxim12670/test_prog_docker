import type { Request, Response } from "express";
import { readAllData, appendData, writeAllData } from "../utils/fileHelper.ts";
import type IPerson from "../interfaces/IPerson.ts";

// Вспомогательная функция для проверки валидности Person
function isValidPerson(data: any): data is Omit<IPerson, "id" | "createdAt"> {
  return (
    data &&
    typeof data === "object" &&
    typeof data.age === "number" &&
    data.age > 0 &&
    data.age < 150 &&
    typeof data.name === "string" &&
    data.name.trim().length > 0
  );
}

// Создать запись о персоне
export const createPerson = async (req: Request, res: Response) => {
  try {
    const personData = req.body;
    console.log(req.body);
    // Валидация входных данных
    if (!isValidPerson(personData)) {
      return res.status(400).json({
        error: "Неверные данные. Требуются: age (число от 1 до 149) и name (непустая строка)",
      });
    }

    // Читаем существующие записи для определения следующего ID
    const existingPersons = (await readAllData()) as IPerson[];

    // Находим максимальный ID и увеличиваем на 1
    const maxId = existingPersons.length > 0 ? Math.max(...existingPersons.map((p) => p.id)) : 0;

    const newPerson: IPerson = {
      id: maxId + 1,
      age: personData.age,
      name: personData.name.trim(),
      createdAt: new Date().toISOString(),
    };

    await appendData(newPerson);

    res.status(201).json({
      message: "Персона успешно создана",
      person: newPerson,
    });
  } catch (error) {
    console.error("Ошибка создания персоны:", error);
    res.status(500).json({ error: "Ошибка при создании персоны" });
  }
};

// Получить всех персон
export const getAllPersons = async (req: Request, res: Response) => {
  try {
    const persons = (await readAllData()) as IPerson[];

    // Сортировка по ID (можно изменить на другую)
    persons.sort((a, b) => a.id - b.id);

    res.json(persons);
  } catch (error) {
    console.error("Ошибка получения персон:", error);
    res.status(500).json({ error: "Ошибка при получении списка персон" });
  }
};

// Получить персону по ID
export const getPersonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const personId = parseInt(id as string, 10);

    if (isNaN(personId)) {
      return res.status(400).json({ error: "Некорректный ID" });
    }

    const persons = (await readAllData()) as IPerson[];
    const person = persons.find((p) => p.id === personId);

    if (!person) {
      return res.status(404).json({ error: "Персона не найдена" });
    }

    res.json(person);
  } catch (error) {
    console.error("Ошибка получения персоны:", error);
    res.status(500).json({ error: "Ошибка при получении персоны" });
  }
};

// Обновить персону
export const updatePerson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const personId = parseInt(id as string, 10);
    const updateData = req.body;

    if (isNaN(personId)) {
      return res.status(400).json({ error: "Некорректный ID" });
    }

    // Валидация данных для обновления (хотя бы одно поле должно быть)
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "Нет данных для обновления" });
    }

    // Проверка типов данных, если они предоставлены
    if (
      updateData.age !== undefined &&
      (typeof updateData.age !== "number" || updateData.age <= 0 || updateData.age >= 150)
    ) {
      return res.status(400).json({ error: "Некорректное значение age (должно быть числом от 1 до 149)" });
    }

    if (updateData.name !== undefined && (typeof updateData.name !== "string" || updateData.name.trim().length === 0)) {
      return res.status(400).json({ error: "Некорректное значение name (непустая строка)" });
    }

    const persons = (await readAllData()) as IPerson[];
    const index = persons.findIndex((p) => p.id === personId);

    if (index === -1) {
      return res.status(404).json({ error: "Персона не найдена" });
    }

    // Обновляем только предоставленные поля
    const updatedPerson: IPerson = {
      ...persons[index],
      ...(updateData.age && { age: updateData.age }),
      ...(updateData.name && { name: updateData.name.trim() }),
      // Не обновляем id и createdAt
    };

    persons[index] = updatedPerson;
    await writeAllData(persons);

    res.json({
      message: "Персона успешно обновлена",
      person: updatedPerson,
    });
  } catch (error) {
    console.error("Ошибка обновления персоны:", error);
    res.status(500).json({ error: "Ошибка при обновлении персоны" });
  }
};

// Удалить персону
export const deletePerson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const personId = parseInt(id as string, 10);

    if (isNaN(personId)) {
      return res.status(400).json({ error: "Некорректный ID" });
    }

    const persons = (await readAllData()) as IPerson[];
    const filteredPersons = persons.filter((p) => p.id !== personId);

    if (persons.length === filteredPersons.length) {
      return res.status(404).json({ error: "Персона не найдена" });
    }

    await writeAllData(filteredPersons);
    res.json({ message: "Персона успешно удалена" });
  } catch (error) {
    console.error("Ошибка удаления персоны:", error);
    res.status(500).json({ error: "Ошибка при удалении персоны" });
  }
};

// Поиск персон по имени или возрасту
export const searchPersons = async (req: Request, res: Response) => {
  try {
    const { name, minAge, maxAge } = req.query;
    const persons = (await readAllData()) as IPerson[];

    let results = [...persons];

    // Фильтр по имени (частичное совпадение, регистронезависимое)
    if (name && typeof name === "string") {
      const searchName = name.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(searchName));
    }

    // Фильтр по минимальному возрасту
    if (minAge && !isNaN(parseInt(minAge as string, 10))) {
      const min = parseInt(minAge as string, 10);
      results = results.filter((p) => p.age >= min);
    }

    // Фильтр по максимальному возрасту
    if (maxAge && !isNaN(parseInt(maxAge as string, 10))) {
      const max = parseInt(maxAge as string, 10);
      results = results.filter((p) => p.age <= max);
    }

    res.json(results);
  } catch (error) {
    console.error("Ошибка поиска персон:", error);
    res.status(500).json({ error: "Ошибка при поиске персон" });
  }
};
