import axios, { AxiosInstance, AxiosResponse } from "axios";
import { UUID, privateDecrypt, publicEncrypt } from "crypto";
import { io, Socket } from "socket.io-client";

import { Account, AccountStatuses, Token } from "./types/users.js";
import { User } from "./users.js";
import * as httpTypes from "./types/http.js";
import * as socketTypes from "./types/socket.js"
import * as messageTypes from "./types/messages.js";
import { Message } from "./messages.js";
import { NoServerResponse, opcodeEnumeration } from "./errors.js";
import { EventEmitter } from "events";
import { Client } from "./client.js";

export class HTTPConnection {
    readonly account: Account;
    readonly opts: httpTypes.CreateClientOptions;
    readonly instance: AxiosInstance;
    public keys: httpTypes.Keys;

    public socket: SocketConnection;

    constructor(account: Account, opts: httpTypes.CreateClientOptions = {}, socket: SocketConnection) {
        this.account = account
        this.opts = opts
        this.keys = opts.keys ? opts.keys : {}
        
        this.socket = socket;

        this.instance = axios.create({
            headers: {
                Authorization: account.token
            },
            baseURL: "localhost:17672",
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

    async getAccountInfo() : Promise<httpTypes.UserResponse> {
        const response = await this.instance.get("/@me");

        return response.data;
    }

    async editNickname(nickname: string) : Promise<void> {
        await this.instance.patch("/@me/nickname", {
            nickname: nickname
        });
    }

    async changePassword(password: string, oldPassword: string) : Promise<Token> {
        const response: AxiosResponse<{token: Token}> = await this.instance.patch("/@me/password", {
            password: oldPassword,
            new: password
        });

        return response.data.token;
    }

    /**
     * ### IMPORTANT: YOU CAN GET ONLY USERS THAT HAS CONVERSATION WITH YOU
     * 
     */
    async getUser(user: UUID) : Promise<User> {
        const response: AxiosResponse<httpTypes.UserResponse> = await this.instance.get(`/conversations/${user}`);

        return new User(response.data, this, this.socket);
    }
    
    async getConversations(): Promise<Array<User>> {
        const response: AxiosResponse<Array<UUID>> = await this.instance.get("/conversations");
        
        let users: Array<User> = []

        for (const user of response.data) {
            users.push(await this.getUser(user));
        }

        return users;
    }

    async createConversation(user: UUID, publicKey: string, privateKey: string) : Promise<void> {
        await this.instance.post("/conversations", {
            user: user,
            key: publicKey
        });

        this.keys[user] = {
            public: publicKey,
            private: privateKey
        }
    }

    async closeConversation(user: UUID) : Promise<void> {
        await this.instance.delete(`/conversations/${user}`);
    }

    async getMessage(id: string) : Promise<Message> {
        const response: AxiosResponse<messageTypes.Message> = await this.instance.get(`/messages/${id}`);

        let message = new Message(response.data, this, this.socket);
        if (message.receiver === this.account.uuid) {
            message.content = privateDecrypt(this.keys[message.author].private, Buffer.from(message.content)).toString('utf-8');
            message.encrypted = false
        }

        return message;
    }

    async getMessages(user: UUID, limit: httpTypes.Limit = 50, after: string | undefined = undefined) : Promise<Array<Message>> {
        const response: AxiosResponse<Array<messageTypes.Message>> = await this.instance.get(`/messages/${user}`, {
            params: {limit: limit, after: after}
        });

        
        let keys = this.keys[user]
        let messages: Array<Message> = []

        for (const message of response.data) {
            let messageObject = new Message(message, this, this.socket);
            if (message.receiver === this.account.uuid) {
                messageObject.content = privateDecrypt(keys.private, Buffer.from(message.content, "base64")).toString("utf-8");
                messageObject.encrypted = false
            }

            messages.push(messageObject);
        }

        return messages;
    }

    async getAllMessages(user: UUID, after: string | undefined = undefined): Promise<Array<Message>> {
        let afterMessage: string | undefined = after
        let allMessages: Array<Message> = []

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

    async sendMessage(user: UUID, content: string) : Promise<Message> {
        const publicKey = this.keys[user].public

        const message = publicEncrypt(publicKey, Buffer.from(content));

        const response = await this.instance.post("/messages", {
            user: user,
            content: message
        });

        let messageObject = new Message({
            type: "message",
            id: response.data.id,
            author: this.account.uuid,
            receiver: user,
            content: content,
            datetime: new Date().getTime(),
            editDatetime: null,
            read: false
        }, this, this.socket);
        messageObject.encrypted = false

        return messageObject;
    }

    async deleteMessage(id: string) {
        await this.instance.delete(`/messages/${id}`);
    }

    async deleteMessages(user: UUID, ids: Array<string>) {
        await this.instance.post(`${user}/messages/delete/bulk`, {
            data: ids
        });
    }

    async editMessage(id: string, content: string) {
        const message = await this.getMessage(id);
        const publicKey = this.keys[message.author].public

        const edited = publicEncrypt(publicKey, Buffer.from(content));

        await this.instance.patch("/messages", {
            id: id,
            content: edited
        });
    }

    async sendKey(user: UUID, publicKey: string, privateKey: string) {
        await this.instance.post("/key", {
            key: publicKey,
            receiver: user
        });

        this.keys[user] = {
            public: publicKey,
            private: privateKey
        }
    }

    async getPublicKey(user: UUID) : Promise<string> {
        const response: AxiosResponse<{key: string}> = await this.instance.get("keys/" + user);
        
        return response.data.key;
    }

}

export class SocketConnection extends EventEmitter {
    readonly account: Account;
    readonly opts: socketTypes.CreateSocketOptions;
    public keys: httpTypes.Keys | undefined;
    readonly socket: Socket;

    public http: HTTPConnection | undefined;

    constructor(account: Account, opts: socketTypes.CreateSocketOptions, http: HTTPConnection | undefined) {
        super();

        this.account = account
        this.opts = opts
        this.keys = http?.keys
        this.http = http;

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
            this.socket.on("newMessages", (messages: Array<messageTypes.Message>) => {
                let newMessages = [];

                for (const message of messages) {
                    let objectMessage = new Message(message, this.http, this);
                    if (this.http && message.author !== this.account.uuid) {
                        objectMessage.content = privateDecrypt(this.http.keys[message.author].private, Buffer.from(message.content)).toString("utf-8")
                        objectMessage.encrypted = false
                    }
                    newMessages.push(objectMessage);
                }

                this.emit("newMessages", newMessages);
            });

            this.socket.onAny((event: string, ...args) => {
                this.emit(event, ...Object.values(args[0]));
            });

            this.socket.on("error", (error: httpTypes.ErrorResponse) => {
                throw new opcodeEnumeration[error.opcode](undefined, this.socket);
            });
        });
    }

    async markMessageAsRead(id: string) {
        this.socket.emit("markMessageRead", {id: id});
    }

    async typing(user: UUID) {
        this.socket.emit("typing", {user: user});
    }

    async changeStatus(status: AccountStatuses) {
        this.socket.emit("changeStatus", {status: status});
        
        // Set status if no errors received
        setTimeout(() => {
            this.account.status = status
        }, 500);
    }
}

export async function createAccount(name: string, nickname: string, password: string) : Promise<Account> {
    const response: AxiosResponse<httpTypes.CreateAccountResponse> = await axios.post("/accounts", {
        name: name,
        nickname: nickname,
        password: password
    })
    
    if (response.status !== 200) {
        throw new opcodeEnumeration[response.data.opcode](undefined, response);
    }

    return {
        uuid: response.data.id,
        name: response.data.name,
        nickname: response.data.nickname,
        password: password,
        token: response.data.token,
        avatar: null,
    };
}

export async function login(name: string, password: string, options: httpTypes.CreateClientOptions | socketTypes.CreateSocketOptions) : Promise<Client> {
    const response: AxiosResponse<httpTypes.AccountResponse> = await axios.get(`/login/${name}/${password}`);

    if (response.status !== 200) {
        throw new opcodeEnumeration[response.data.opcode](undefined, response);
    }

    return new Client(response.data, options);
}