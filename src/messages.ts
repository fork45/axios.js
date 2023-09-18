import { UUID, privateDecrypt, publicEncrypt } from "crypto";

import { HTTPConnection, SocketConnection } from "./connections.js";
import * as types from "./types/messages.js";
import EventEmitter from "events";
import { decryptMessage, encryptMessage } from "./keys.js";

export class Message extends EventEmitter {
    readonly type: types.MessageTypes;
    readonly id: string;
    readonly author: UUID;
    readonly receiver: UUID;
    private _content: string;
    readonly iv: string | null;
    readonly datetime: Date;

    constructor(data: types.ConversationMessage) {
        super();

        this.type = data.type
        this.id = data.id
        this.author = data.author
        this.receiver = data.receiver
        this._content = data.content
        this.iv = data.iv
        this.datetime = new Date(data.datetime);
    }

    public get content(): string {
        return this._content;
    }

    public set content(value: string) {
        this._content = value;
    }

}

export class RSAKeyMessage extends Message {
    
    constructor(data: types.RSAKeyMessage) {
        super(data);

        this.content = Buffer.from(this.content, "base64").toString("utf8");
    }

    encryptText(message: string): string {
        return publicEncrypt(this.content, Buffer.from(message)).toString("base64");
    }

}

export class AESKeyMessage extends Message {
    readonly socket: SocketConnection;
    public editDatetime: Date | null;
    readonly userKey: string | undefined;
    readonly conversationKey: string | undefined;

    constructor(data: types.AESKeyMessage, socket: SocketConnection) {
        super(data);

        this.socket = socket
        this.editDatetime = data.editDatetime ? new Date(data.editDatetime) : null;

        this.userKey = this.socket.account.publicKey
        const user = data.author === this.socket.account.id ? data.receiver : data.author;
        this.conversationKey = this.socket.keys[user]?.private

        try {
            if (!this.editDatetime)
                this.content = privateDecrypt(
                    this.userKey as string,
                    Buffer.from(this.content, "base64")
                ).toString("utf8");
            else
                this.content = privateDecrypt(
                    this.conversationKey as string,
                    privateDecrypt(
                        this.userKey as string,
                        Buffer.from(this.content, "base64")
                    )
                ).toString("utf8");

            encryptMessage(this.content, "Hello World!");
        } catch (error) {
            if (!this.conversationKey) {
                this.encryptText = (message: string) => {throw new Error("AES key is not decrypted")};
                this.decryptText = (message: string) => {throw new Error("AES key is not decrypted")};

                throw new Error("No conversation key");
            }
        }

        this.socket.on("aesKeyEdit", (message: AESKeyMessage) => {
            this.content = message.content
            this.editDatetime = message.editDatetime

            this.emit("aesKeyEdit");
        });
    }

    async encryptText(message: string): Promise<{ iv: string, encrypted: string }> {
        return encryptMessage(this.content, message)
    }

    async decryptText(message: string, iv: string): Promise<string> {
        return decryptMessage(this.content, message, iv);
    }

}


export class TextMessage extends Message {
    readonly editDatetime: Date | null;
    private _read: boolean = false;

    readonly connection: HTTPConnection;
    readonly socket: SocketConnection;
        
    private _encrypted: boolean = true;

    constructor(data: types.Message, connection: HTTPConnection, socket: SocketConnection) {
        super(data);
        
        this.connection = connection
        this.socket = socket

        this.editDatetime = data.editDatetime ? new Date(data.editDatetime) : null;
        this._read = data.read

        if (this.connection.keys[this.author]) {
            this.content = decryptMessage(this.connection.keys[this.author].aes, this.content, this.iv as string);
            this._encrypted = false;            
        }

        this.socket.on("conversationDelete", async (user: UUID) => {
            if (user !== this.author || user !== this.receiver)
                return;

            this.deleteMessage = async () => false;
            this.editMessage = async () => false;

            this.emit("messageDelete");
        });

        this.socket.on("messageEdit", async (message: TextMessage) => {
            if (message.id !== this.id)
                return;

            this.content = message.content
            this.encrypted = message.encrypted

            this.emit("messageEdit");
        });

        this.socket.on("messageDelete", (id: string) => {
            if (id !== this.id)
                return;

            this.deleteMessage = async () => false;
            this.editMessage = async () => false;

            this.emit("messageDelete");
        });

        this.socket.on("messagesDelete", (...ids: string[]) => {
            if (!ids.includes(this.id))
                return

            this.deleteMessage = async () => false;
            this.editMessage = async () => false;

            this.emit("messageDelete");
        });

        this.socket.on("readMessages", (...ids: string[]) => {
            if (!ids.includes(this.id))
                return
            
            this._read = true;

            this.emit("readMessage");
        });
    }

    public get encrypted(): boolean {
        return this._encrypted;
    }

    public set encrypted(value: boolean) {
        this._encrypted = value
    }

    public get read(): boolean {
        return this._read;
    }

    async deleteMessage(): Promise<boolean | void> {
        if (this.connection.account.id !== this.author) return false;

        await this.connection.deleteMessage(this.id);
    }

    async editMessage(content: string): Promise<void | boolean> {
        if (this.connection.account.id !== this.author || !this.connection.keys[this.author])
            return false;

        const keys = this.connection.keys[this.author]
        await this.connection.editMessage(this.receiver, this.id, (encryptMessage(keys.aes, content)).encrypted);
        
        this.content = content
    }

}