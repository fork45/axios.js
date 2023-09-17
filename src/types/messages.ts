import { UUID } from "crypto"

export type MessageTypes = "message" | "aes_key" | "rsa_key";

export interface ConversationMessage {
    type: MessageTypes;
    id: string;
    author: UUID;
    receiver: UUID;
    content: string;
    iv: string | null;
    datetime: number;
    editDatetime: number | null;
    read: boolean;
}

export interface Message extends ConversationMessage {
    type: "message";
    editDatetime: number | null;
    read: boolean;
}

export interface RSAKeyMessage extends ConversationMessage {
    type: "rsa_key";
    iv: null;
    editDatetime: null;
    read: false;
}

export interface AESKeyMessage extends ConversationMessage {
    type: "aes_key";
    iv: null;
    read: false;
}