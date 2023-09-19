import axios, { AxiosInstance, AxiosResponse } from "axios";
import { UUID, privateDecrypt, publicEncrypt, randomBytes } from "crypto";
import { io, Socket } from "socket.io-client";

import { Account, AccountStatuses, Profile, Token } from "./types/users.js";
import { User } from "./users.js";
import * as types from "./types/connection.js"
import * as httpTypes from "./types/http.js";
import * as messageTypes from "./types/messages.js";
import { AESKeyMessage, Message, RSAKeyMessage, TextMessage } from "./messages.js";
import { NoServerResponse, opcodeEnumeration } from "./errors.js";
import { EventEmitter } from "events";
import { Client } from "./client.js";
import { KeyPair, decryptMessage, editMessage, encryptMessage } from "./keys.js";

export class HTTPConnection {
    readonly account: Account;
    readonly opts: types.ConnectionOptions;
    readonly instance: AxiosInstance;
    public keys: httpTypes.Keys;

    public socket: SocketConnection;

    constructor(account: Account, opts: types.ConnectionOptions = { keys: {} }, socket: SocketConnection) {
        this.account = account
        this.opts = opts
        this.keys = opts.keys ? opts.keys : {}
        
        this.socket = socket;

        this.instance = axios.create({
            headers: {
                Authorization: account.token
            },
            baseURL: "localhost:80",
            validateStatus(status) {
                return status < 300;
            },
        });

        this.instance.interceptors.response.use(response => {return response}, error => {
            if (error.request) throw new NoServerResponse(undefined, error.request);

            const response: AxiosResponse<httpTypes.ErrorResponse> = error.response

            throw new opcodeEnumeration[response.data.opcode](undefined, response);
        });

        this.socket.on("conversationKey", (user: UUID, key: string) => {
            this.keys[user].public = key
        });
    }

    async getAccountInfo(): Promise<httpTypes.AccountResponse> {
        const response = await this.instance.get<httpTypes.AccountResponse>("/@me");

        return response.data;
    }

    async editNickname(nickname: string): Promise<void> {
        await this.instance.patch("/profile/nickname", {
            nickname: nickname
        });
    }

    async changePassword(password: string, oldPassword: string): Promise<Token> {
        const response = await this.instance.patch<{ token: Token }>("/@me/password", {
            password: oldPassword,
            new: password
        });

        return response.data.token;
    }

    async getUser(user: UUID): Promise<User> {
        const response = await this.instance.get<httpTypes.ProfileResponse>(`/profile/${user}`);

        return new User(response.data, this, this.socket);
    }
    
    async getConversations(): Promise<Array<User>> {
        const response = await this.instance.get<Array<Profile>>("/conversations");

        return Promise.all(response.data.map((profile) => 
            new User(profile, this, this.socket)
        ));
    }

    async createConversation(user: UUID): Promise<void> {
        const profile = await this.instance.get<Profile>(`/profile/${user}`)
        const aesKey = randomBytes(32).toString("hex");

        await this.instance.post("/conversations", {
            user: user,
            key: publicEncrypt(Buffer.from(profile.data.publicKey, "base64"), Buffer.from(aesKey)).toString("base64")
        });

        this.keys[user] = {
            public: undefined,
            private: undefined,
            aes: aesKey
        }
    }

    async closeConversation(user: UUID): Promise<void> {
        await this.instance.delete(`/conversations/${user}`);
    }

    async getMessage(user: UUID, id: string): Promise<Message> {
        const response = await this.instance.get<messageTypes.Message>(`/messages/${user}/${id}`);

        const message = new TextMessage(response.data, this, this.socket);

        return message;
    }

    async getMessages(user: UUID, limit: httpTypes.Limit = 50, after: string | undefined = undefined): Promise<Array<TextMessage>> {
        const response = await this.instance.get<Array<messageTypes.Message>>(`/messages/${user}`, {
            params: {limit: limit, after: after}
        });

        return Promise.all(response.data.map((message) => new TextMessage(message, this, this.socket)));
    }

    async getAllMessages(user: UUID, after: string | undefined = undefined): Promise<Array<TextMessage>> {
        let afterMessage: string | undefined = after
        let allMessages: Array<TextMessage> = []

        while (true) {
            let messages = await this.getMessages(user, 100, afterMessage);
            if (messages.length !== 0) {
                allMessages = allMessages.concat(messages);
                afterMessage = messages[messages.length - 1].id

                continue;
            }

            break;
        }

        return allMessages;
    };

    async sendMessage(user: UUID, content: string): Promise<TextMessage> {
        const key = this.keys[user]
        const message = encryptMessage(key.aes, content);

        const response = await this.instance.post<messageTypes.Message>("/messages", {
            user: user,
            content: message.encrypted,
            iv: message.iv
        });

        return new TextMessage(response.data, this, this.socket);
    }

    async deleteMessage(id: string) {
        await this.instance.delete(`/messages/${id}`);
    }

    async deleteMessages(user: UUID, ids: Array<string>) {
        await this.instance.post(`/messages/${user}/bulk`, {
            data: ids
        });
    }

    async editMessage(user: UUID, id: string, content: string) {
        const message = await this.getMessage(user, id);
        const key = this.keys[message.author]

        const edited = editMessage(key.aes, message.iv as string, content);

        await this.instance.patch("/messages", {
            message: id,
            content: edited,
        });
    }

    async sendKey(user: UUID): Promise<KeyPair> {
        const keys = new KeyPair();
        
        await this.instance.post("/keys", {
            key: keys.public.export().toString("utf8"),
            user: user
        });

        setTimeout(async () => {
            const aesKey = await this.instance.get<messageTypes.AESKeyMessage>(`/keys/${user}`, { params: { key: "aes" } });

            this.keys[user] = {
                public: keys.public.export().toString("utf8"),
                private: keys.private.export().toString("utf8"),
                aes: privateDecrypt(this.keys[this.account.id].private as string, Buffer.from(aesKey.data.content)).toString("utf8")
            }
        }, 300);

        return keys;
    }

    async getPublicKey(user: UUID): Promise<RSAKeyMessage> {
        const response = await this.instance.get<messageTypes.RSAKeyMessage>(`/keys/${user}`, { params: { key: "rsa" } });
        
        return new RSAKeyMessage(response.data);
    }

    async getAESKey(user: UUID): Promise<AESKeyMessage> {
        const response = await this.instance.get<messageTypes.AESKeyMessage>(`/keys/${user}`, { params: { key: "aes" } });

        return new AESKeyMessage(response.data, this.socket);
    }

}

export class SocketConnection extends EventEmitter {
    readonly account: Account;
    readonly opts: types.ConnectionOptions;
    public keys: httpTypes.Keys;
    readonly socket: Socket;

    public http: HTTPConnection | undefined;

    constructor(account: Account, opts: types.ConnectionOptions = { keys: {} }, http: HTTPConnection | undefined) {
        super();

        this.account = account
        this.opts = opts
        this.keys = opts.keys

        this.socket = io(`ws://localhost:${opts.socketPort}`, {
            auth: {
                token: account.token
            }
        });

        new Promise<void>((resolve) => {
            this.socket.on("ready", () => {
                resolve();
            });
        }).then(() => {
            this.socket.on("newConversation", (user: UUID, key: messageTypes.AESKeyMessage) => {
                const message = new AESKeyMessage(key, this);
                this.keys[user].aes = message.content
                this.emit("newConversation", { user: user, key: message });

                this.http?.sendKey(user);
            });

            this.socket.on("newMessages", (messages: Array<messageTypes.Message>) => {
                let newMessages = [];

                for (const message of messages) {
                    let objectMessage = new TextMessage(message, this.http as HTTPConnection, this);
                    newMessages.push(objectMessage);
                }

                this.emit("newMessages", newMessages);
            });

            this.socket.on("newMessage", (message: messageTypes.Message) => {
                this.emit("newMessage", new TextMessage(message, this.http as HTTPConnection, this));
            });

            this.socket.on("messageEdit", (message: messageTypes.Message) => {
                this.emit("messageEdit", new TextMessage(message, this.http as HTTPConnection, this));
            });

            this.socket.on("aesKeyEdit", async (message: messageTypes.AESKeyMessage) => {
                const key = new AESKeyMessage(message, this);
                this.keys[message.author].aes = key.content
                this.emit("aesKeyEdit", key);
            });

            this.socket.on("rsaKey", (message: messageTypes.RSAKeyMessage) => {
                this.keys[message.author].public = Buffer.from(message.content, "base64").toString("utf8");
                this.emit("rsaKey", new RSAKeyMessage(message));
            });

            this.socket.onAny((event: string, data: any) => {
                this.emit(event, ...Object.values(data));
            });

            this.socket.on("error", (error: httpTypes.ErrorResponse) => {
                throw new opcodeEnumeration[error.opcode](undefined, this.socket);
            });
        });
    }

    async typing(user: UUID) {
        this.socket.emit("typing", {user: user});
    }

    async changeStatus(status: AccountStatuses) {
        this.socket.emit("changeStatus", {status: status});
    }
}

export async function createAccount(name: string, nickname: string, password: string): Promise<Account> {
    const response: AxiosResponse<httpTypes.AccountResponse> = await axios.post("/accounts", {
        name: name,
        nickname: nickname,
        password: password
    })
    
    if (response.status !== 200)
        throw new opcodeEnumeration[response.data.opcode](undefined, response);

    return response.data
}

export async function login(name: string, password: string, options: types.ConnectionOptions): Promise<Client> {
    const response: AxiosResponse<httpTypes.AccountResponse> = await axios.get(`/login/${name}/${password}`);

    if (response.status !== 200)
        throw new opcodeEnumeration[response.data.opcode](undefined, response);
    

    return new Client(response.data, options);
}

export async function loginByToken(token: Token, options: types.ConnectionOptions): Promise<Client> {
    const response: AxiosResponse<httpTypes.AccountResponse> = await axios.get(`/@me`, {headers: {
        Authorization: token
    }});

    if (response.status !== 200)
        throw new opcodeEnumeration[response.data.opcode](undefined, response);
    

    return new Client(response.data, options);
}