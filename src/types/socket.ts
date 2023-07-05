import { UUID } from "crypto";

import { Message } from "../messages.js";
import { UserStatuses } from "./users.js";

export interface CreateSocketOptions {
    "onNewConversation"?: (user: UUID) => void;
    "onConversationDelete"?: (user: UUID) => void;
    "onConversationKey"?: (user: UUID) => void;
    "onNewMessage"?: (id: string, user: UUID, content: string) => void;
    "onMessageDelete"?: (id: string) => void;
    "onMessageEdit"?: (id: string, content: string) => void;
    "onWaitingUsers"?: (users: Array<UUID>) => void;
    "onNewMessages"?: (messages: Array<Message>) => void;
    "onStatus"?: (user: UUID, status: UserStatuses) => void;
    "onReadMessage"?: (id: string) => void;
    "onTyping"?: (user: UUID) => void;
}

/** @internal */
export interface NewMessage {
    _id: string;
    user: UUID;
    content: string
}

/** @internal */
export interface MessageEdit {
    _id: string;
    content: string;
}

/** @internal */
export interface Status {
    user: UUID;
    status: UserStatuses;
}