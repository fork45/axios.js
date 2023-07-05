import { UUID } from "crypto"

export interface ConversationMessage {
    type: "message" | "key";
    _id: string;
    author: UUID;
    receiver: UUID;
    content: string;
    datetime: number;
}

export interface Message extends ConversationMessage {
    type: "message";
    editDatetime: number | null;
    read: boolean;
}

export interface KeyMessage extends ConversationMessage {
    type: "key";
}