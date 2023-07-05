import axios, { AxiosInstance, AxiosResponse } from "axios";
import { UUID, privateDecrypt, publicEncrypt } from "crypto";
import { io, Socket } from "socket.io-client";

import { Account, AccountStatuses } from "./types/users.js";
import { User } from "./users.js";
import * as httpTypes from "./types/http.js";
import * as socketTypes from "./types/socket.js"
import * as messageTypes from "./types/messages.js";
import { Message } from "./messages.js";
import { NoServerResponse, opcodeEnumeration } from "./errors.js";
import { EventEmitter } from "events";

export class HTTPConnection {
    readonly account: Account;
    readonly opts: httpTypes.CreateClientOptions;
    readonly instance: AxiosInstance;
    readonly keys: httpTypes.Keys;

    public socket: SocketConnection | undefined;

    constructor(account: Account, opts: httpTypes.CreateClientOptions = {}, socket: SocketConnection | undefined = undefined) {
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
    }

    async getAccountInfo() : Promise<httpTypes.UserResponse> {
        const response = await this.instance.get("/@me");

        return response.data;
    }

    /**
     * ### IMPORTANT: YOU CAN GET ONLY USERS THAT HAS CONVERSATION WITH YOU
     * 
     */
    async getUser(user: UUID) : Promise<User> {
        const response: AxiosResponse<httpTypes.UserResponse> = await this.instance.get(`/conversations/${user}`);

        return new User(response.data);
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
            _id: response.data._id,
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
}

export class SocketConnection extends EventEmitter {
    readonly account: Account;
    readonly opts: socketTypes.CreateSocketOptions;
    readonly keys: httpTypes.Keys;
    readonly socket: Socket;

    public http: HTTPConnection | undefined;

    constructor(account: Account, opts: socketTypes.CreateSocketOptions, keys: httpTypes.Keys, http: HTTPConnection | undefined = undefined) {
        super();

        this.account = account
        this.opts = opts
        this.keys = keys
        this.http = http;

        this.socket = io("ws://localhost:4508", {
            auth: {
                token: account.token
            }
        });

        new Promise<void>((resolve) => {
            this.socket.on("ready", () => {
                resolve();
            });
        }).then(() => {
            this.socket.on("newMessage", (message: socketTypes.NewMessage) => {
                opts.onNewMessage ? opts.onNewMessage(message._id, message.user, message.content) : null;
            });

            this.socket.on("messageEdit", (message: socketTypes.MessageEdit) => {
                opts.onMessageEdit ? opts.onMessageEdit(message._id, message.content) : null;
            });

            this.socket.on("newMessages", (messages: Array<messageTypes.Message>) => {
                let newMessages = [];

                for (const message of messages) {
                    newMessages.push(new Message(message));
                }

                opts.onNewMessages ? opts.onNewMessages(newMessages) : null;
            });

            this.socket.on("status", (status: socketTypes.Status) => {
                opts.onStatus ? opts.onStatus(status.user, status.status) : null
            });

            this.socket.onAny((event: string, ...args) => {
                let handler = opts[("on" + (event.charAt(0).toUpperCase() + event.slice(0))) as keyof socketTypes.CreateSocketOptions];
                handler ? handler(args[0], args[1] as never, args[2]) : null;
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
        uuid: response.data._id,
        name: response.data.name,
        nickname: response.data.nickname,
        password: password,
        token: response.data.token
    };
}