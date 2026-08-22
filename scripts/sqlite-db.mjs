import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = resolve(repositoryRoot, "prisma", "dev.db");

mkdirSync(dirname(databasePath), { recursive: true });
closeSync(openSync(databasePath, "a"));
