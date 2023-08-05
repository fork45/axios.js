import { UUID } from "crypto";
import EventEmitter from "events";

declare qwapi;

/********************
*
* client.ts
*
*********************/

export class Client {
    readonly http: HTTPConnection;
    readonly socket: SocketConnection;

    constructor(account: Account, opts: CreateClientOptions | CreateSocketOptions = {});

    async deleteAccount(password: string): Promise<void>;

}


/********************
*
* connections.ts
*
*********************/

export class HTTPConnection {
    readonly account: Account;
    readonly opts: CreateClientOptions;
    readonly instance: AxiosInstance;
    public keys: Keys;

    public socket: SocketConnection;

    constructor(account: Account, opts: CreateClientOptions = {}, socket: SocketConnection);

    async getAccountInfo(): Promise<UserResponse>;
    async editNickname(nickname: string): Promise<void>;
    async changePassword(password: string, oldPassword: string): Promise<Token>;
    async getUser(user: UUID): Promise<User>;
    async getConversations(): Promise<Array<User>>;
    async createConversation(user: UUID, publicKey: string, privateKey: string): Promise<void>;
    async closeConversation(user: UUID): Promise<void>;
    async getMessage(id: string): Promise<Message>;
    async getMessages(user: UUID, limit: Limit = 50, after: string | undefined = undefined): Promise<Array<Message>>;
    async getAllMessages(user: UUID, after: string | undefined = undefined): Promise<Array<Message>>;
    async sendMessage(user: UUID, content: string): Promise<Message>;
    async deleteMessage(id: string);
    async deleteMessages(user: UUID, ids: Array<string>);
    async editMessage(id: string, content: string);
    async sendKey(user: UUID, publicKey: string, privateKey: string);
    async getPublicKey(user: UUID): Promise<string>;

}

export class SocketConnection extends EventEmitter {
    readonly account: Account;
    readonly opts: CreateSocketOptions;
    public keys: Keys | undefined;
    readonly socket: Socket;

    public http: HTTPConnection | undefined;

    constructor(account: Account, opts: CreateSocketOptions, http: HTTPConnection | undefined = undefined);

    async markMessageAsRead(id: string);
    async typing(user: UUID);
    async changeStatus(status: AccountStatuses);
}

export async function createAccount(name: string, nickname: string, password: string): Promise<Account>;


/********************
*
* errors.ts
*
*********************/

export class ClientError extends Error {
    readonly response: AxiosResponse<ErrorResponse> | Socket | undefined | null;

    constructor(message: string, response: AxiosResponse<ErrorResponse> | Socket | undefined | null);

}

export class ServerError extends Error {
    readonly response: AxiosResponse | Socket | undefined | null;

    constructor(message: string, response: AxiosResponse | Socket | undefined | null);

}

export class NoToken extends ClientError {

    constructor(message: string = "No token in request header", response: AxiosResponse | Socket);

}

export class InvalidToken extends ClientError {
    readonly token: Token;

    constructor(message: string = "Invalid Token", response: AxiosResponse | Socket);
}

export class UserNotFound extends ClientError {
    readonly user: UUID | undefined;

    constructor(message: string = "User not found", response: AxiosResponse | Socket);

}

export class InvalidMessageLength extends ClientError {

    constructor(message: string = "Your message must be no longer than 900 letters and not less than 1 letter", response: AxiosResponse | Socket);

}

export class InvalidNicknameOrNameLength extends ClientError {
    readonly userName: string | undefined;
    readonly userNickname: string | undefined;

    constructor(message: string = "Your nickname or name must be no longer than 255 letters and no less than 4 letters", response: AxiosResponse | Socket);

}

export class InvalidPasswordLength extends ClientError {
    readonly password: string | undefined;

    constructor(message: string = "Password length should be long than 8 characters", response: AxiosResponse | Socket);

}

export class NameDoesntFitRegex extends ClientError {
    readonly regex: RegExp;

    constructor(message: string = "Your name doesn't fit this regex: ^[a-zA-Z0-9_-]+$", response: AxiosResponse | Socket);

}

export class InvalidStatus extends ClientError {

    constructor(message: string = "There's only three statuses: online, do not disturb, hidden", response: AxiosResponse | Socket);

}

export class NoMessage extends ClientError {
    readonly id: string | undefined;

    constructor(message: string = "Message doesn't exists", response: AxiosResponse | Socket);

}

export class NoPermissionToEdit extends ClientError {
    readonly id: string | undefined;

    constructor(message: string = "You can't edit this message", response: AxiosResponse | Socket);

}

export class NoPermissionToMarkAsRead extends ClientError {
    readonly id: string | undefined;

    constructor(message: string = "You can't mark as read this message", response: AxiosResponse | Socket);

}

export class MessageAlreadyRead extends ClientError {
    readonly id: string | undefined;

    constructor(message: string = "This message has already been read", response: AxiosResponse | Socket);

}

export class InvalidLimit extends ClientError {
    readonly limit: number | undefined;

    constructor(message: string = "Limit should be more than 1 and less than 100", response: AxiosResponse | Socket);

}

export class AlreadyHaveConversation extends ClientError {
    readonly id: string | undefined;

    constructor(message: string = "You already have conversation with this user", response: AxiosResponse | Socket);

}

export class DontHaveConversation extends ClientError {
    readonly id: string | undefined;

    constructor(message: string = "You don't have conversation with this user", response: AxiosResponse | Socket);
}

export class InvalidRsaKey extends ClientError {
    readonly key: string | undefined;

    constructor(message: string = "Invalid RSA Key", response: AxiosResponse | Socket);

}

export class DidntCreatedConversation extends ClientError {
    readonly id: string | undefined;

    constructor(message: string = "User didn't created conversation with you", response: AxiosResponse | Socket);

}

export class AlreadySentKey extends ClientError {
    readonly key: string | undefined;

    constructor(message: string = "You already sent RSA Key", response: AxiosResponse | Socket);

}

export class IncorrectPassword extends ClientError {
    readonly password: string | undefined;

    constructor(message: string = "Incorrect password", response: AxiosResponse | Socket);

}

export class InvalidMessageNumber extends ClientError {
    readonly length: number | undefined;

    constructor(message: string = "You can only delete more than 2 and less than 100 messages in one request", response: AxiosResponse | Socket);
}

export class InvalidMessageId extends ClientError {
    readonly id: string | undefined;

    constructor(message: string = "One of the id is invalid: ", response: AxiosResponse | Socket);
}

export class NoServerResponse extends ServerError {

    constructor(message: string = "The request was made but no response was received", request: any);

}

export const opcodeEnumeration = [
    NoToken,
    InvalidToken,
    UserNotFound,
    InvalidMessageLength,
    InvalidNicknameOrNameLength,
    InvalidPasswordLength,
    NameDoesntFitRegex,
    InvalidStatus,
    NoMessage,
    NoPermissionToEdit,
    NoPermissionToMarkAsRead,
    MessageAlreadyRead,
    InvalidLimit,
    AlreadyHaveConversation,
    DontHaveConversation,
    InvalidRsaKey,
    DidntCreatedConversation,
    AlreadySentKey,
    IncorrectPassword,
    InvalidMessageNumber,
    InvalidMessageId
]


/********************
*
* messages.ts
*
*********************/

export class Message extends EventEmitter {
    readonly id: string;
    readonly author: UUID;
    readonly receiver: string;
    public content: string;
    readonly datetime: Date;
    readonly editDatetime: Date | null;
    private _read: boolean;
    readonly connection: HTTPConnection | undefined;
    readonly socket: SocketConnection | undefined;

    public encrypted: boolean;

    constructor(data: HTTPMessage, connection: HTTPConnection | undefined = undefined, socket: SocketConnection | undefined = undefined);

    public get read(): boolean;
    
    async deleteMessage(): Promise<boolean>;
    async editMessage(content: string): Promise<boolean>;
    async markAsRead(): Promise<boolean>;

}


/********************
*
* rsa.ts
*
*********************/

export class KeyPair {
    readonly private: crypto.KeyObject;
    readonly public: crypto.KeyObject;

    constructor();

    encrypt(content: string): string;
    decrypt(content: string): string;

}

export class PublicKey {
    readonly key: crypto.KeyObject;

    constructor(key: string | crypto.KeyObject);

    encrypt(content: string): string;

}


/********************
*
* users.ts
*
*********************/

export class User extends EventEmitter {
    readonly uuid: UUID;
    readonly name: string;
    private _nickname: string;
    private _avatar: string | null;
    private _lastMessage: string | Message;
    private _status: types.UserStatuses | undefined;

    readonly http: HTTPConnection | undefined;
    readonly socket: SocketConnection | undefined;

    constructor(data: HTTPUser, http: HTTPConnection | undefined = undefined, socket: SocketConnection | undefined = undefined);

    public get lastMessage(): string | Message;
    public get nickname(): string;
    public get avatar(): string | null;
    public get status(): types.UserStatuses;

    async closeConversation(): Promise<boolean>;
    async getMessages(limit: Limit = 50, after: string | undefined = undefined): Promise<boolean | Array<Message>>;
    async getAllMessages(after: string | undefined = undefined): Promise<boolean | Array<Message>>;
    async deleteMessages(ids: Array<string>): Promise<boolean>;
}


/********************
*
* types/http.ts
*
*********************/


type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>
type NumberRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>

export type Limit = NumberRange<0, 101>

export interface ErrorResponse {
    opcode: number;
    message: string;
};

export interface CreateClientOptions {
    keys?: Keys;
};

export interface HTTPResponse extends ErrorResponse { };

export interface UserResponse extends HTTPResponse, User { };

export interface CreateAccountResponse extends HTTPResponse {
    id: UUID;
    name: string;
    nickname: string;
    token: Token;
};

export interface Keys {
    [name: UUID]: {
        public: string;
        private: string;
    }
};

/********************
*
* types/messages.ts
*
*********************/

export interface ConversationMessage {
    type: "message" | "key";
    id: string;
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

/********************
*
* types/socket.ts
*
*********************/

export interface CreateSocketOptions {
    socketPort?: 45088 | number;
};

export interface EventData { };

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

/********************
*
* types/users.ts
*
*********************/

export type Token = `${string}.${string}.${string}`;

export type AccountStatuses = "online" | "do not disturb" | "hidden";
export type UserStatuses = "online" | "do not disturb" | "offline";


export interface HTTPUser {
    id: UUID;
    name: string;
    nickname: string;
    status?: UserStatuses;
    lastMessage: string;
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