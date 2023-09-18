import { UUID, privateDecrypt, publicDecrypt } from "crypto";
import EventEmitter from "events";

import * as types from "./types/users.js";
import { HTTPConnection, SocketConnection } from "./connections.js";
import { Key, Limit } from "./types/http.js";
import { AESKeyMessage, Message, RSAKeyMessage, TextMessage } from "./messages.js";

export class User extends EventEmitter {
    readonly id: UUID;
    readonly name: string;
    private _nickname: string;
    private _avatar: string | null;
    private _status: types.UserStatuses | undefined;
    readonly publicKey: string;
    public keys: Key;

    readonly http: HTTPConnection;
    readonly socket: SocketConnection;

    constructor(data: types.Profile, http: HTTPConnection, socket: SocketConnection) {
        super();
        
        this.http = http
        this.socket = socket

        this.id = data.id
        this.name = data.name
        this._nickname = data.nickname
        this._avatar = data.avatar
        this._status = data.status
        this.publicKey = Buffer.from(data.publicKey, "base64").toString("utf8");
        this.keys = http.keys[this.id]

        this.socket.on("userDelete", (id: UUID) => {
            if (this.id !== id)
                return;

            this.emit("userDelete");

            this.createConversation = async () => {};
            this.closeConversation = async () => {};
            this.getMessages = async () => [];
            this.getAllMessages = async () => [];
            this.deleteMessages = async () => {};
        });

        this.socket.on("newConversation", (user: UUID, key: AESKeyMessage) => {
            if (user !== this.id)
                return;

            this.emit("newConversation", { key: key });

            this.keys = this.http.keys[user]
        });

        this.socket.on("rsaKey", (message: RSAKeyMessage) => {
            if (message.author !== this.id || message.receiver !== this.id)
                return;

            this.emit("rsaKey", message);
            this.keys = this.http.keys[this.id]
        });

        this.socket.on("avatarChange", (user: UUID, hash: string) => {
            if (user !== this.id)
                return;

            this._avatar = hash
            this.emit("avatarChange", hash);
        });

        this.socket.on("nicknameChange", (user: UUID, nickname: string) => {
            if (user !== this.id)
                return;

            this._nickname = nickname
            this.emit("nicknameChange", nickname);
        });

        this.socket.on("newMessage", (message: TextMessage) => {
            if (message.author !== this.id)
                return;

            this.emit("newMessage", message);
        });

        this.socket.on("status", (user: UUID, status: types.UserStatuses) => {
            if (user !== this.id)
                return;
            
            this._status = status
            this.emit("status", status);
        });

        this.socket.on("conversationDelete", (user: UUID) => {
            if (user !== this.id)
                return;
            
            this.emit("conversationDelete");

            this.closeConversation = async () => {};
            this.getMessages = async () => [];
            this.getAllMessages = async () => [];
            this.deleteMessages = async () => {};
        });
    }

    public get avatar(): string | null {
        return this._avatar;
    }

    public get nickname(): string {
        return this._nickname;
    }

    public get status(): types.UserStatuses | undefined {
        return this._status;
    }

    async createConversation() {
        await this.http.createConversation(this.id);
    }

    async closeConversation(): Promise<void> {
        await this.http.closeConversation(this.id);
    }

    async getMessages(limit: Limit = 50, after: string | undefined = undefined): Promise<Array<Message>> {
        return await this.http.getMessages(this.id, limit, after);
    }

    async getAllMessages(after: string | undefined = undefined): Promise<Message[]> {
        return await this.http.getAllMessages(this.id, after);
    }

    async deleteMessages(ids: Array<string>): Promise<void> {
        await this.http.deleteMessages(this.id, ids);
    }

}