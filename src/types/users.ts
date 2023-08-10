import { UUID } from "crypto";

export type Token = `${string}.${string}.${string}`;

export type AccountStatuses = "online" | "do not disturb" | "hidden";
export type UserStatuses = "online" | "do not disturb" | "offline";


export interface User {
    uuid: UUID;
    name: string;
    nickname: string;
    status?: UserStatuses;
    lastMessage: string | null;
    avatar: string | null;
};

export interface Account {
    uuid: UUID;
    name: string;
    nickname: string;
    status?: AccountStatuses;
    password: string;
    token: Token;
    conversations?: Array<UUID>;
    avatar: string | null;
}