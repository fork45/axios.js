import { UUID } from "crypto";

import { HTTPConnection, SocketConnection } from "./connections.js";
import * as types from "./types/messages.js";

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

    constructor(data: types.Message, connection: HTTPConnection | undefined = undefined, socket: SocketConnection | undefined = undefined) {
        this.connection = connection
        this.socket = socket
        
        this.id = data._id
        this.author = data.author
        this.receiver = data.receiver
        this.content = data.content
        this.datetime = new Date(data.datetime);
        this.editDatetime = data.editDatetime ? new Date(data.editDatetime) : null;
        this.read = data.read

        this.encrypted = true;
    }

    async deleteMessage() : Promise<boolean> {
        if (!this.connection) return false;

        await this.connection.deleteMessage(this.id);

        return true;
    }

    async editMessage(content: string) : Promise<boolean> {
        if (!this.connection) return false;

        await this.connection.editMessage(this.id, content);
        
        this.content = content

        return true;
    }

    async markAsRead() : Promise<boolean> {
        if (!this.socket || this.read) return false;

        await this.socket.markMessageAsRead(this.id);

        return true;
    }

}