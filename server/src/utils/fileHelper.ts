import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const _fileName = fileURLToPath(import.meta.url);
const _dirName = path.dirname(_fileName);

const DB_PATH = path.join(_dirName, "../database.txt");

// Используем fs.promises для работы с промисами
const fsPromises = fs.promises;

export async function initDatabaseFile() {
  try {
    await fsPromises.access(DB_PATH);
    console.log("Файл базы данных существует");
  } catch {
    // Файл не существует, создаем его
    await fsPromises.writeFile(DB_PATH, "", "utf8");
    console.log("Создан новый файл базы данных");
  }
}

export async function readAllData(): Promise<any[]> {
  try {
    const data = await fsPromises.readFile(DB_PATH, "utf8");
    if (!data.trim()) return [];

    // Предполагаем, что каждая запись на отдельной строке в формате JSON
    return data
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
  } catch (error) {
    console.error("Ошибка чтения файла:", error);
    return [];
  }
}

export async function appendData(record: any): Promise<void> {
  try {
    const recordString = JSON.stringify(record) + "\n";
    await fsPromises.appendFile(DB_PATH, recordString, "utf8");
    console.log("Данные успешно записаны");
  } catch (error) {
    console.error("Ошибка записи в файл:", error);
    throw error;
  }
}

export async function writeAllData(records: any[]): Promise<void> {
  try {
    const dataString = records.map((r) => JSON.stringify(r)).join("\n");
    await fsPromises.writeFile(DB_PATH, dataString + (records.length ? "\n" : ""), "utf8");
  } catch (error) {
    console.error("Ошибка перезаписи файла:", error);
    throw error;
  }
}
