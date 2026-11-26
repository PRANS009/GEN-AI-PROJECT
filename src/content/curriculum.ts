import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface Lesson {
  id: string;
  title: string;
  database: string;
  concept: string;
  syntax: string;
  example: string;
  expectedOutput: string;
  exercisePrompt: string;
  starterSql: string;
  solutionSql: string;
  hints?: string[];
}

export interface Module {
  id: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Challenge {
  id: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  database: string;
  description: string;
  starterSql: string;
  solutionSql: string;
  hints?: string[];
}

export interface Curriculum {
  modules: Module[];
  challenges: Challenge[];
}

const raw = JSON.parse(
  readFileSync(resolve(process.cwd(), "content/curriculum.json"), "utf8"),
) as Curriculum;

export default raw;
export const curriculum = raw;
