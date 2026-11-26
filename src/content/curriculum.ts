import raw from "../../content/curriculum.json" with { type: "json" };

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

const typed = raw as Curriculum;
export default typed;
export const curriculum = typed;
