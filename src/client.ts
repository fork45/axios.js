import { HTTPConnection, SocketConnection, createAccount } from "./connections.js";
import { CreateClientOptions } from "./types/http.js";
import { CreateSocketOptions } from "./types/socket.js";
import { Account } from "./types/users.js";
import { NoServerResponse } from "./errors.js";

export class Client {
    readonly http: HTTPConnection;
    readonly socket: SocketConnection;

    constructor(account: Account, opts: CreateClientOptions | CreateSocketOptions = {}) {
        this.socket = new SocketConnection(account, opts as CreateSocketOptions, undefined);
        this.http = new HTTPConnection(account, opts as CreateClientOptions, this.socket);
        this.socket.http = this.http;
        this.socket.keys = this.http.keys;
    }

    async deleteAccount(password: string): Promise<void> {
        await this.http.instance.delete("/@me/" + password);

        this.socket.socket.disconnect();

        this.http.instance.interceptors.request.use(() => {
            throw new NoServerResponse(undefined, undefined);
        });
    }

}

export default { 
    Client,
    createAccount,
    HTTPConnection,
    SocketConnection
};