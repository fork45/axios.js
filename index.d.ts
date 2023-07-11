import { UUID } from "crypto";

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

}


/********************
*
* connections.ts
*
*********************/

export class HTTPConnection {
    readonly account: Account;
    readonly opts: httpTypes.CreateClientOptions;
    readonly instance: AxiosInstance;
    readonly keys: httpTypes.Keys;

    public socket: SocketConnection | undefined;

    constructor(account: Account, opts: httpTypes.CreateClientOptions = {}, socket: SocketConnection | undefined = undefined);

    async getAccountInfo(): Promise<httpTypes.UserResponse>;
    async getUser(user: UUID): Promise<User>;
    async getConversations(): Promise<Array<User>>;
    async createConversation(user: UUID, publicKey: string, privateKey: string): Promise<void>;
    async closeConversation(user: UUID): Promise<void>;
    async getMessage(id: string): Promise<Message>;
    async getMessages(user: UUID, limit: httpTypes.Limit = 50, after: string | undefined = undefined): Promise<Array<Message>>;
    async getAllMessages(user: UUID, after: string | undefined = undefined): Promise<Array<Message>>;
    async sendMessage(user: UUID, content: string): Promise<Message>;
    async deleteMessage(id: string);
    async editMessage(id: string, content: string);
    async sendKey(user: UUID, publicKey: string, privateKey: string);

}

export class SocketConnection extends EventEmitter {
    readonly account: Account;
    readonly opts: socketTypes.CreateSocketOptions;
    readonly keys: httpTypes.Keys;
    readonly socket: Socket;

    public http: HTTPConnection | undefined;

    constructor(account: Account, opts: socketTypes.CreateSocketOptions, keys: httpTypes.Keys, http: HTTPConnection | undefined = undefined);

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
    IncorrectPassword
]


/********************
*
* messages.ts
*
*********************/

export class Message {
    readonly id: string;
    readonly author: UUID;
    readonly receiver: string;
    public content: string;
    readonly datetime: Date;
    readonly editDatetime: Date | null;
    readonly read: boolean;
    readonly connection: HTTPConnection | undefined;
    readonly socket: SocketConnection | undefined;

    public encrypted: boolean;

    constructor(data: types.Message, connection: HTTPConnection | undefined = undefined, socket: SocketConnection | undefined = undefined);

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

export class User {
    readonly uuid: UUID;
    readonly name: string;
    readonly nickname: string;
    readonly lastMessage: string | Message;

    readonly http: HTTPConnection | undefined;
    readonly socket: SocketConnection | undefined;

    constructor(data: types.User, http: HTTPConnection | undefined = undefined, socket: SocketConnection | undefined = undefined);

    async closeConversation(): Promise<boolean>;
    async getMessages(limit: Limit = 50, after: string | undefined = undefined): Promise<boolean | Array<Message>>;
    async getAllMessages(after: string | undefined = undefined): Promise<boolean | Array<Message>>;
}


/********************
*
* types/http.ts
*
*********************/

export type Limit = NumberRange<0, 101>

export interface ErrorResponse {
    opcode: number;
    message: string;
};

export interface CreateClientOptions {
    keys?: Keys,
};

export interface HTTPResponse extends ErrorResponse { };

export interface UserResponse extends HTTPResponse, User { };

export interface CreateAccountResponse extends HTTPResponse {
    _id: UUID;
    name: string;
    nickname: string;
    token: Token;
};


/********************
*
* types/messages.ts
*
*********************/

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


/********************
*
* types/socket.ts
*
*********************/

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


/********************
*
* types/users.ts
*
*********************/

export type Token = `${string}.${string}.${string}`;

export type AccountStatuses = "online" | "do not disturb" | "hidden";
export type UserStatuses = "online" | "do not disturb" | "offline";


export interface User {
    uuid: UUID;
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