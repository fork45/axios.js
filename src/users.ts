import { UUID, publicDecrypt } from "crypto";

import * as types from "./types/users.js";
import { HTTPConnection, SocketConnection } from "./connections.js";
import { Limit } from "./types/http.js";
import { Message } from "./messages.js";
import EventEmitter from "events";

export class User extends EventEmitter {
    readonly uuid: UUID;
    readonly name: string;
    readonly nickname: string;
    readonly lastMessage: string | Message;
    public status: types.UserStatuses | undefined;

    readonly http: HTTPConnection | undefined;
    readonly socket: SocketConnection | undefined;

    constructor(data: types.User, http: HTTPConnection | undefined = undefined, socket: SocketConnection | undefined = undefined) {
        super();
        
        this.uuid = data.uuid
        this.name = data.name
        this.nickname = data.nickname
        this.status = data.status

        let message: Message | string = data.lastMessage;
        new Promise<Message | string>((resolve) => {
            if (!http) {
                resolve(data.lastMessage);

                return;
            }

            resolve(http.getMessage(data.lastMessage));
        }).then((messageObject) => {
            message = messageObject;
        });
        this.lastMessage = message

        this.http = http
        this.socket = socket

        this.socket?.on("newMessage", (id: string, user: UUID, content: string) => {
            if (!this.http || user !== this.uuid) {
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

            this.emit("newMessage", message);
        });

        this.socket?.on("status", (user: UUID, status: types.UserStatuses) => {
            if (user !== this.uuid) {
                return;
            }

            this.status = status
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