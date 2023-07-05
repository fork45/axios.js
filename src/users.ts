import { UUID } from "crypto";

import * as types from "./types/users.js";
import { HTTPConnection, SocketConnection } from "./connections.js";
import { Limit } from "./types/http.js";
import { Message } from "./messages.js";

export class User {
    readonly uuid: UUID;
    readonly name: string;
    readonly nickname: string;
    readonly lastMessage: string | Message;

    readonly http: HTTPConnection | undefined;
    readonly socket: SocketConnection | undefined;

    constructor(data: types.User, http: HTTPConnection | undefined = undefined, socket: SocketConnection | undefined = undefined) {
        this.uuid = data.uuid
        this.name = data.name
        this.nickname = data.nickname

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

}