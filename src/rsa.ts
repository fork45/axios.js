import * as crypto from "crypto";

export class KeyPair {
    readonly private: crypto.KeyObject;
    readonly public: crypto.KeyObject;

    constructor() {
        let keys = crypto.generateKeyPairSync("rsa", {modulusLength: 4096});
        this.private = keys.privateKey
        this.public = keys.publicKey
    }

    encrypt(content: string) : string {
        return crypto.publicEncrypt(this.public, Buffer.from(content)).toString("base64");
    }

    decrypt(content: string) : string {
        return crypto.privateDecrypt(this.private, Buffer.from(content)).toString("utf-8");
    }

}

export class PublicKey {
    readonly key: crypto.KeyObject;

    constructor(key: string | crypto.KeyObject) {
        this.key = crypto.createPublicKey(key);
    }

    encrypt(content: string) : string {
        return crypto.publicEncrypt(this.key, Buffer.from(content)).toString("base64");
    }

}