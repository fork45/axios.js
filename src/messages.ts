import { UUID, privateDecrypt, publicDecrypt } from "crypto";

import { HTTPConnection, SocketConnection } from "./connections.js";
import * as types from "./types/messages.js";
import EventEmitter from "events";

export class Message extends EventEmitter {
    readonly id: string;
    readonly author: UUID;
    readonly receiver: string;
    public content: string;
    readonly datetime: Date;
    readonly editDatetime: Date | null;
    private _read: boolean;


    readonly connection: HTTPConnection | undefined;
    readonly socket: SocketConnection | undefined;
    
    public encrypted: boolean;

    constructor(data: types.Message, connection: HTTPConnection | undefined = undefined, socket: SocketConnection | undefined = undefined) {
        super();
        
        this.connection = connection
        this.socket = socket
        
        this.id = data.id
        this.author = data.author
        this.receiver = data.receiver
        this.content = data.content
        this.datetime = new Date(data.datetime);
        this.editDatetime = data.editDatetime ? new Date(data.editDatetime) : null;
        this._read = data.read

        this.encrypted = true;


        this.socket?.on("messageEdit", (id: string, content: string) => {
            if (id !== this.id)
                return;

            
            if (!this.connection) {
                this.content = content
                this.encrypted = true
    
                return;
            }

            let key = this.connection.keys[this.author].private
            if (key) {
                this.content = privateDecrypt(key, Buffer.from(content)).toString("utf-8");
                
                this.encrypted = false                
            }

            this.emit("messageEdit", ...Object.values(arguments));
        });

        this.socket?.on("messageDelete", (id: string) => {
            if (id !== this.id)
                return;

            this.deleteMessage = async () => {return false};
            this.editMessage = async () => {return false};
            this.markAsRead = async () => {return false};

            this.emit("messageDelete", ...Object.values(arguments));
        });

        this.socket?.on("readMessage", (id: string) => {
            if (id !== this.id)
                return;
            
            this._read = true;

            this.markAsRead = async () => {return false};

            this.emit("readMessage", ...Object.values(arguments));
        });
    }

    public get read() : boolean {
        return this._read;
    }

    async deleteMessage() : Promise<boolean> {
        if (!this.connection) return false;

        if (this.connection.account.uuid !== this.author) return false;

        await this.connection.deleteMessage(this.id);

        return true;
    }

    async editMessage(content: string) : Promise<boolean> {
        if (!this.connection) return false;

        if (this.connection.account.uuid !== this.author) return false;

        await this.connection.editMessage(this.id, content);
        
        this.content = content

        return true;
    }

    async markAsRead() : Promise<boolean> {
        if (!this.socket || this.read) return false;

        if (this.socket.account.uuid !== this.author) return false;

        await this.socket.markMessageAsRead(this.id);

        return true;
    }

}