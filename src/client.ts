import { HTTPConnection, SocketConnection, createAccount } from "./connections.js";
import { CreateClientOptions } from "./types/http.js";
import { CreateSocketOptions } from "./types/socket.js";
import { Account } from "./types/users.js";

export class Client {
    readonly http: HTTPConnection;
    readonly socket: SocketConnection;

    constructor(account: Account, opts: CreateClientOptions | CreateSocketOptions = {}) {
        this.http = new HTTPConnection(account, opts as CreateClientOptions);
        this.socket = new SocketConnection(account, opts as CreateSocketOptions, this.http.keys);
    }

}

export default { 
    Client,
    createAccount,
    HTTPConnection,
    SocketConnection
};