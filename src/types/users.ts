import { UUID } from "crypto";

export type Token = `${string}.${string}.${string}`;

export type AccountStatuses = "online" | "do not disturb" | "hidden";
export type UserStatuses = "online" | "do not disturb" | "offline";

export interface User {
    id: UUID;
    name: string;
    nickname: string;
    status?: UserStatuses;
    avatar: string | null;
};

export interface Profile extends User {
    publicKey: string;
};

export interface Account {
    id: UUID;
    name: string;
    nickname: string;
    status?: AccountStatuses;
    password: string;
    token: Token;
    conversations?: Array<UUID>;
    avatar: string | null;
    publicKey: string;
}