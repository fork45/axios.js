import { UUID } from "crypto";
import EventEmitter from "events";
import { KeyObject } from "crypto";

declare "axios.js";

/********************
*
* client.ts
*
*********************/

export class Client {
    readonly account: Account;
    readonly http: HTTPConnection;
    readonly socket: SocketConnection;

    constructor(account: Account, opts: ConnectionOptions = { keys: {} });

    async deleteAccount(password: string): Promise<void>;
}


/********************
*
* connections.ts
*
*********************/

export class HTTPConnection {
    readonly account: Account;
    readonly opts: ConnectionOptions;
    readonly instance: AxiosInstance;
    public keys: Keys;
    public socket: SocketConnection;

    constructor(account: Account, opts: ConnectionOptions = { keys: {} }, socket: SocketConnection);

    async getAccountInfo(): Promise<AccountResponse>;
    async editNickname(nickname: string): Promise<void>;
    async changePassword(password: string, oldPassword: string): Promise<Token>;
    async getUser(user: UUID): Promise<User>;
    async getConversations(): Promise<Array<User>>;
    async createConversation(user: UUID): Promise<void>;
    async closeConversation(user: UUID): Promise<void>;
    async getMessage(user: UUID, id: string): Promise<Message>;
    async getMessages(user: UUID, limit: Limit = 50, after: string | undefined = undefined): Promise<Array<TextMessage>>;
    async getAllMessages(user: UUID, after: string | undefined = undefined): Promise<Array<TextMessage>>;
    async sendMessage(user: UUID, content: string): Promise<Message>;
    async deleteMessage(id: string);
    async deleteMessages(user: UUID, ids: Array<string>);
    async editMessage(user: UUID, id: string, content: string);
    async sendKey(user: UUID): Promise<KeyPair>;
    async getPublicKey(user: UUID): Promise<RSAKeyMessage>;
    async getAESKey(user: UUID): Promise<AESKeyMessage>;

}

export class SocketConnection extends EventEmitter {
    readonly account: Account;
    readonly opts: ConnectionOptions;
    public keys: Keys;
    readonly socket: Socket;

    public http: HTTPConnection | undefined;

    constructor(account: Account, opts: ConnectionOptions = { keys: {} }, http: HTTPConnection | undefined);

    async typing(user: UUID);

    async changeStatus(status: AccountStatuses);
}

export async function createAccount(name: string, nickname: string, password: string): Promise<Account>;

export async function login(name: string, password: string, options: ConnectionOptions): Promise<Client>;

export async function loginByToken(token: Token, options: ConnectionOptions): Promise<Client>;

/********************
*
* errors.ts
*
*********************/

export class ClientError extends Error {
    readonly response: AxiosResponse<ErrorResponse> | Socket | null;

    constructor(message: string, response: AxiosResponse<ErrorResponse> | Socket | null);

}

export class ServerError extends Error {
    readonly response: AxiosResponse | Socket | null;

    constructor(message: string, response: AxiosResponse | Socket | null);

}

export class NoToken extends ClientError {

    constructor(message: string = "No token in request header", response: AxiosResponse | Socket);

}

export class InvalidToken extends ClientError {
    readonly token: Token;

    constructor(message: string = "Invalid Token", response: AxiosResponse | Socket);

}

export class UserNotFound extends ClientError {
    readonly user: UUID | undefined = undefined;

    constructor(message: string = "User not found", response: AxiosResponse | Socket);

}

export class AvatarNotFound extends ClientError {
    readonly avatar: string | undefined = undefined;

    constructor(message: string = "Avatar not found", response: AxiosResponse | Socket);

}

export class InvalidMessageLength extends ClientError {

    constructor(message: string = "Your message must be no longer than 900 letters and not less than 1 letter", response: AxiosResponse | Socket);

}

export class InvalidPasswordLength extends ClientError {
    readonly password: string | undefined = undefined;

    constructor(message: string = "Password length should be long than 8 characters", response: AxiosResponse | Socket);

}

export class NameDoesntMatchRegex extends ClientError {
    readonly regex: RegExp;

    constructor(message: string = "Your name doesn't fit this regex: ^[a-zA-Z0-9_-]+${4, 255}", response: AxiosResponse | Socket);

}

export class NicknameDoesntMatchRegex extends ClientError {
    readonly regex: RegExp;

    constructor(message: string = "Your nickname doesn't fit this regex: ^[a-zA-Z0-9_-]+${4, 255}", response: AxiosResponse | Socket);

}

export class NameTaken extends ClientError {
    readonly nameInResponse: string | undefined = undefined;

    constructor(message: string = "This name is already taken", response: AxiosResponse | Socket);

}

export class InvalidStatus extends ClientError {

    constructor(message: string = "There's only three statuses: online, do not disturb, hidden", response: AxiosResponse | Socket);

}

export class NoPermissionToEdit extends ClientError {
    readonly id: string | undefined = undefined;

    constructor(message: string = "You can't edit this message", response: AxiosResponse | Socket);

}


export class InvalidLimit extends ClientError {
    readonly limit: number | undefined = undefined;

    constructor(message: string = "Limit should be more than 1 and less than 100", response: AxiosResponse | Socket);

}

export class MessageNotFound extends ClientError {
    readonly messageId: string | undefined = undefined;

    constructor(message: string = "Message not found", response: AxiosResponse | Socket);

}

export class ConversationExists extends ClientError {
    readonly id: string | undefined = undefined;

    constructor(message: string = "You have conversation with this user", response: AxiosResponse | Socket);

}

export class ConversationNotReady extends ClientError {
    readonly user: string | undefined = undefined;

    constructor(message: string = "One sides haven't sent the security key yet", response: AxiosResponse | Socket);

}

export class NoConversation extends ClientError {
    readonly id: string | undefined = undefined;

    constructor(message: string = "You don't have conversation with this user", response: AxiosResponse | Socket);

}

export class InvalidRsaKey extends ClientError {
    readonly key: string | undefined = undefined;

    constructor(message: string = "Invalid RSA Key", response: AxiosResponse | Socket);

}

export class NoPermissionToSendKey extends ClientError {
    readonly key: string | undefined = undefined

    constructor(message: string = "No permission to send key", response: AxiosResponse | Socket);

}

export class IncorrectPassword extends ClientError {
    readonly password: string | undefined = undefined;

    constructor(message: string = "Incorrect password", response: AxiosResponse | Socket);

}

export class InvalidAvatarFormat extends ClientError {

    constructor(message: string = "Avatars can be only jpeg or png", response: AxiosResponse | Socket);

}

export class InvalidAvatarSize extends ClientError {

    constructor(message: string = "Max avatar size is 10mb", response: AxiosResponse | Socket);

}

export class InvalidMessageNumber extends ClientError {
    readonly length: number | undefined = undefined;

    constructor(message: string = "You can only delete more than 2 and less than 100 messages in one request", response: AxiosResponse | Socket);
}

export class NoPermissionToDelete extends ClientError {
    readonly length: number | undefined = undefined;

    constructor(message: string = "You can't delete this message", response: AxiosResponse | Socket);
}

export class InvalidMessageId extends ClientError {
    readonly id: string | undefined = undefined;

    constructor(message: string = "One of the id is invalid: ", response: AxiosResponse | Socket);
}

export class NoServerResponse extends ServerError {

    constructor(message: string = "The request was made but no response was received", request: any);

}

export const opcodeEnumeration: ErrorOpcode = {
    "NO_TOKEN": NoToken,
    "INVALID_TOKEN": InvalidToken,
    "NAME_DOESNT_MATCH_REGEX": NameDoesntMatchRegex,
    "NAME_TAKEN": NameTaken,
    "INCORRECT_PASSWORD": IncorrectPassword,
    "INVALID_AVATAR_FORMAT": InvalidAvatarFormat,
    "INVALID_AVATAR_SIZE": InvalidAvatarSize,
    "INVALID_STATUS": InvalidStatus,
    "NO_CONVERSATION": NoConversation,
    "USER_NOT_FOUND": UserNotFound,
    "AVATAR_NOT_FOUND": AvatarNotFound,
    "INVALID_SECURITY_KEY": InvalidRsaKey,
    "NO_PERMISSION_TO_SEND_KEY": NoPermissionToSendKey,
    "CONVERSATION_EXISTS": ConversationExists,
    "CONVERSATION_NOT_READY": ConversationNotReady,
    "INVALID_MESSAGE_LENGTH": InvalidMessageLength,
    "INVALID_LIMIT": InvalidLimit,
    "MESSAGE_NOT_FOUND": MessageNotFound,
    "NO_PERMISSION_TO_EDIT": NoPermissionToEdit,
    "INVALID_MESSAGE_NUMBER": InvalidMessageNumber,
    "NO_PERMISSION_TO_DELETE": NoPermissionToDelete,
}

/********************
*
* messages.ts
*
*********************/

export class Message extends EventEmitter {
    readonly type: MessageTypes;
    readonly id: string;
    readonly author: UUID;
    readonly receiver: UUID;
    private _content: string;
    readonly iv: string | null;
    readonly datetime: Date;

    constructor(data: ConversationMessage);

    public get content(): string;
    public set content(value: string);
}

export class RSAKeyMessage extends Message {
    constructor(data: RSAKeyMessage);

    encryptText(message: string): string;
}

export class AESKeyMessage extends Message {
    readonly socket: SocketConnection;
    public editDatetime: Date | null;
    readonly userKey: string | undefined;
    readonly conversationKey: string | undefined;

    constructor(data: AESKeyMessage, socket: SocketConnection);

    async encryptText(message: string): Promise<{ iv: string, encrypted: string }>;
    async decryptText(message: string, iv: string): Promise<string>;

}


export class TextMessage extends Message {
    readonly editDatetime: Date | null;
    private _read: boolean = false;
    readonly connection: HTTPConnection;
    readonly socket: SocketConnection;
    private _encrypted: boolean = true;

    constructor(data: Message, connection: HTTPConnection, socket: SocketConnection);

    public get encrypted(): boolean;
    public set encrypted(value: boolean);
    public get read(): boolean;

    async deleteMessage(): Promise<boolean | void>;
    async editMessage(content: string): Promise<void | boolean>;
}

/********************
*
* keys.ts
*
*********************/

export class KeyPair {
    readonly private: KeyObject;
    readonly public: KeyObject;

    constructor();

    encrypt(content: string): string
    decrypt(content: string): string

}

export function encryptMessage(aesKey: string, message: string): { iv: string, encrypted: string };

export function editMessage(aesKey: string, iv: string, message: string): string;

export function decryptMessage(aesKey: string, encrypted: string, iv: string): string;

/********************
*
* users.ts
*
*********************/

export class User extends EventEmitter {
    readonly id: UUID;
    readonly name: string;
    private _nickname: string;
    private _avatar: string | null;
    private _status: UserStatuses | undefined;
    readonly publicKey: string;
    public keys: Key;

    readonly http: HTTPConnection;
    readonly socket: SocketConnection;

    constructor(data: Profile, http: HTTPConnection, socket: SocketConnection);

    public get avatar(): string | null;
    public get nickname(): string;
    public get status(): UserStatuses | undefined;


    async createConversation();
    async closeConversation(): Promise<void>;
    async getMessages(limit: Limit = 50, after: string | undefined = undefined): Promise<Array<Message>>
    async getAllMessages(after: string | undefined = undefined): Promise<Message[]>;
    async deleteMessages(ids: Array<string>): Promise<void>;
}

/********************
*
* types/connection.ts
*
*********************/

export interface ConnectionOptions extends CreateClientOptions, CreateSocketOptions { }

/********************
*
* types/errors.ts
*
*********************/

export interface ErrorOpcode {
    [opcode: string]: any
};

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
    opcode: string;
};

export interface CreateClientOptions {
    keys: Keys;
};

export interface HTTPResponse extends ErrorResponse { };

export interface UserResponse extends HTTPResponse, User { };

export interface ProfileResponse extends HTTPResponse, Profile { };

export interface AccountResponse extends HTTPResponse, Account { };

export interface Key {
    public: string | undefined;
    private: string | undefined;
    aes: string;
}

export interface Keys {
    [name: UUID]: Key
};

/********************
*
* types/messages.ts
*
*********************/

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

/********************
*
* types/socket.ts
*
*********************/

export interface CreateSocketOptions {
    socketPort?: 45088 | number;
};

/********************
*
* types/users.ts
*
*********************/

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