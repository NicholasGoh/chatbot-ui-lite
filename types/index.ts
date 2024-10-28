export enum OpenAIModel {
  DAVINCI_TURBO = "gpt-3.5-turbo",
}

export interface Message {
  role: Role;
  content: string;
}

export type Role = "system" | "assistant" | "user";

export interface InsertPayload {
  user_id: string;
  user_query: string;
  completion: string;
}

export interface APIMessage {
  user_query: string;
  completion: string;
}
