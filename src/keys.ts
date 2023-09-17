import crypto from "crypto";

export class KeyPair {
    readonly private: crypto.KeyObject;
    readonly public: crypto.KeyObject;

    constructor() {
        let keys = crypto.generateKeyPairSync("rsa", { modulusLength: 4096 });
        this.private = keys.privateKey
        this.public = keys.publicKey
    }

    encrypt(content: string): string {
        return crypto.publicEncrypt(this.public, Buffer.from(content)).toString("base64");
    }

    decrypt(content: string): string {
        return crypto.privateDecrypt(this.private, Buffer.from(content, "base64")).toString("utf8");
    }

}

export function encryptMessage(aesKey: string, message: string): { iv: string, encrypted: string } {
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
        iv: iv.toString("hex"),
        encrypted: encrypted,
    };
}

export function editMessage(aesKey: string, iv: string, message: string) {
    const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return encrypted;
}

export function decryptMessage(aesKey: string, encrypted: string, iv: string) {
    const decipher = crypto.createCipheriv("aes-256-cbc", aesKey, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf-8");
    decrypted += decipher.final('utf8');
    
    return decrypted
}