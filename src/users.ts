import { UUID, publicDecrypt } from "crypto";

import * as types from "./types/users.js";
import { HTTPConnection, SocketConnection } from "./connections.js";
import { Limit } from "./types/http.js";
import { Message } from "./messages.js";
import EventEmitter from "events";

export class User extends EventEmitter {
    readonly uuid: UUID;
    readonly name: string;
    private _nickname: string;
    private _avatar: string | null;
    private _lastMessage: string | Message;
    private _status: types.UserStatuses | undefined;

    readonly http: HTTPConnection | undefined;
    readonly socket: SocketConnection | undefined;

    constructor(data: types.User, http: HTTPConnection | undefined = undefined, socket: SocketConnection | undefined = undefined) {
        super();
        
        this.uuid = data.uuid
        this.name = data.name
        this._nickname = data.nickname
        this._avatar = data.avatar
        this._status = data.status
        this._lastMessage = data.lastMessage
    
        new Promise<Message | string>((resolve) => {
            if (!http) {
                resolve(data.lastMessage);

                return;
            }

            resolve(http.getMessage(data.lastMessage));
        }).then((messageObject) => {
            this._lastMessage = messageObject;
        });

        this.http = http
        this.socket = socket

        this.socket?.on("avatarChange", (user: UUID, hash: string) => {
            if (user !== this.uuid) {
                return;
            }

            this._avatar = hash
            this.emit("avatarChange", hash);
        });

        this.socket?.on("nicknameChange", (user: UUID, nickname: string) => {
            if (user !== this.uuid) {
                return;
            }

            this._nickname = nickname
            this.emit("nicknameChange", nickname);
        });

        this.socket?.on("newMessage", (id: string, user: UUID, content: string) => {
            if (user !== this.uuid) {
                return;
            }
            if (!this.http) {
                this._lastMessage = id;
                return;
            }

            const buffer = publicDecrypt(this.http.keys[user].public, Buffer.from(content));
            const message = new Message({
                type: "message",
                id: id,
                author: this.uuid,
                receiver: this.http.account.uuid,
                content: buffer.toString("utf-8"),
                datetime: new Date().getTime(),
                editDatetime: null,
                read: false
            }, this.http, this.socket);
            
            message.encrypted = false

            this._lastMessage = message

            this.emit("newMessage", message);
        });

        this.socket?.on("status", (user: UUID, status: types.UserStatuses) => {
            if (user !== this.uuid) {
                return;
            }

            this._status = status
            this.emit("status", status);
        });

        this.socket?.on("conversationDelete", (user: UUID) => {
            if (user !== this.uuid) {
                return;
            }

            this.emit("conversationDelete");


            this.closeConversation = async () => {return false};
            this.getMessages = async () => {return false};
            this.getAllMessages = async () => {return false};
            this.deleteMessages = async () => {return false};
        });
    }
    
    public get lastMessage() : string | Message {
        return this._lastMessage;
    }

    public get avatar() : string | null {
        return this._avatar;
    }

    public get nickname() : string {
        return this._nickname;
    }

    public get status() : types.UserStatuses | undefined {
        return this._status;
    }

    async closeConversation() : Promise<boolean> {
        if (!this.http) return false;

        await this.http.closeConversation(this.uuid);

        return true;
    }

    async getMessages(limit: Limit = 50, after: string | undefined = undefined) : Promise<boolean | Array<Message>> {
        if (!this.http) return false;

        return await this.http.getMessages(this.uuid, limit, after);
    }

    async getAllMessages(after: string | undefined = undefined) : Promise<boolean | Array<Message>> {
        if (!this.http) return false;

        return await this.http.getAllMessages(this.uuid, after);
    }

    async deleteMessages(ids: Array<string>) : Promise<boolean> {
        if (!this.http) return false;

        await this.http.deleteMessages(this.uuid, ids);

        return true;
    }
}