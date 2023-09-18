import { HTTPConnection, SocketConnection, createAccount } from "./connections.js";
import { ConnectionOptions } from "./types/connection.js";
import { Account } from "./types/users.js";
import { NoServerResponse } from "./errors.js";

export class Client {
    readonly account: Account;
    readonly http: HTTPConnection;
    readonly socket: SocketConnection;

    constructor(account: Account, opts: ConnectionOptions = { keys: {} }) {
        this.account = account
        this.socket = new SocketConnection(account, opts, undefined)
        this.http = new HTTPConnection(account, opts, this.socket);
        this.socket.http = this.http
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