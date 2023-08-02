import { UUID } from "crypto";

import { Message } from "../messages.js";
import { UserStatuses } from "./users.js";

export interface CreateSocketOptions {
    socketPort?: 45088 | number;
};

export interface EventData {};

export interface WaitingUsers extends EventData {
    users: Array<UUID>;
};

export interface UserDelete extends EventData {
    user: UUID;
};

export interface NicknameChange extends EventData {
    user: UUID;
    nickname: string;
};

export interface AvatarChange extends EventData {
    user: UUID;
    hash: string;
};

export interface UserTyping extends EventData {
    user: UUID;
};

export interface Status extends EventData {
    user: UUID;
    status: UserStatuses;
};

export interface NewConversation extends EventData {
    user: UUID;
};

export interface ConversationKey extends EventData {
    user: UUID;
    key: string;
};

export interface ConversationDelete extends EventData {
    user: UUID;
};

export interface NewMessages extends EventData {
    messages: Array<Message>;
};

export interface NewMessage extends EventData {
    id: string;
    user: UUID;
    content: string
};

export interface MessageEdit extends EventData {
    id: string;
    content: string;
};

export interface DeleteMessage extends EventData {
    user: UUID;
    id: string;
};

export interface DeleteMessages extends EventData {
    user: UUID;
    messages: Array<string>;
};

export interface ReadMessage extends EventData {
    id: string;
};