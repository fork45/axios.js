import axios, { AxiosResponse } from "axios";
import { UUID } from "crypto";
import { Socket } from "socket.io-client";

import { ErrorResponse } from "./types/http.js";
import { Token } from "./types/users.js";

export class ClientError extends Error {
    readonly response: AxiosResponse<ErrorResponse> | Socket | undefined | null;

    constructor(message: string, response: AxiosResponse<ErrorResponse> | Socket | undefined | null) {
        super(message);
        this.response = response
    }

}

export class ServerError extends Error {    
    readonly response: AxiosResponse | Socket | undefined | null;

    constructor(message: string, response: AxiosResponse | Socket | undefined | null) {
        super(message);
        this.response = response
    }

}

export class NoToken extends ClientError {

    constructor(message: string="No token in request header", response: AxiosResponse | Socket) {
        super(message, response);
    }

}

export class InvalidToken extends ClientError {
    readonly token: Token;

    constructor(message: string="Invalid Token", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {            
            // @ts-ignore
            this.token = response.auth.token
        } else {
            this.token = response.request.headers.Authorization
        }
    }

}

export class UserNotFound extends ClientError {
    readonly user: UUID | undefined;

    constructor(message: string="User not found", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.user = undefined
        } else {
            this.user = response.request.data.user
        }
    }

}

export class InvalidMessageLength extends ClientError {

    constructor(message: string="Your message must be no longer than 900 letters and not less than 1 letter", response: AxiosResponse | Socket) {
        super(message, response);
    }

}

export class InvalidNicknameOrNameLength extends ClientError {
    readonly userName: string | undefined;
    readonly userNickname: string | undefined;

    constructor(message: string="Your nickname or name must be no longer than 255 letters and no less than 4 letters", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.userName = undefined
            this.userNickname = undefined
        } else {
            this.userName = response.request.data.name
            this.userNickname = response.request.data.nickname
        }
    }

}

export class InvalidPasswordLength extends ClientError {
    readonly password: string | undefined;

    constructor(message: string="Password length should be long than 8 characters", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.password = undefined
        } else {
            this.password = response.request.data.password
        }
    }

}

export class NameDoesntFitRegex extends ClientError {
    readonly regex: RegExp;

    constructor(message: string="Your name doesn't fit this regex: ^[a-zA-Z0-9_-]+$", response: AxiosResponse | Socket) {
        super(message, response);
        this.regex = RegExp("^[a-zA-Z0-9_-]+$");
    }

}

export class InvalidStatus extends ClientError {

    constructor(message: string="There's only three statuses: online, do not disturb, hidden", response: AxiosResponse | Socket) {
        super(message, response);
    }

}

export class NoMessage extends ClientError {
    readonly id: string | undefined;

    constructor(message: string="Message doesn't exists", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.id = undefined
        } else {
            this.id = response.request.data.id
        }
    }

}

export class NoPermissionToEdit extends ClientError {
    readonly id: string | undefined;

    constructor(message: string="You can't edit this message", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.id = undefined
        } else {
            this.id = response.request.data.id
        }
    }

}

export class NoPermissionToMarkAsRead extends ClientError {
    readonly id: string | undefined;

    constructor(message: string="You can't mark as read this message", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.id = undefined
        } else {
            this.id = response.request.data.id
        }
    }

}

export class MessageAlreadyRead extends ClientError {
    readonly id: string | undefined;

    constructor(message: string="This message has already been read", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.id = undefined;
        } else {
            this.id = response.request.data.id
        }
    }

}

export class InvalidLimit extends ClientError {
    readonly limit: number | undefined;

    constructor(message: string="Limit should be more than 1 and less than 100", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.limit = undefined
        } else {
            this.limit = response.request.params.limit
        }
    }

}

export class AlreadyHaveConversation extends ClientError {
    readonly id: string | undefined;

    constructor(message: string="You already have conversation with this user", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.id = undefined
        } else {
            this.id = response.request.data.user
        }
    }

}

export class DontHaveConversation extends ClientError {
    readonly id: string | undefined;

    constructor(message: string="You don't have conversation with this user", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.id = undefined
        } else {
            this.id = response.request.data.user
        }
    }

}

export class InvalidRsaKey extends ClientError {
    readonly key: string | undefined;

    constructor(message: string="Invalid RSA Key", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.key = undefined
        } else {
            this.key = response.request.data.key
        }
    }

}

export class DidntCreatedConversation extends ClientError {
    readonly id: string | undefined;

    constructor(message: string="User didn't created conversation with you", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.id = undefined
        } else {
            this.id = response.request.data.user
        }
    }

}

export class AlreadySentKey extends ClientError {
    readonly key: string | undefined;

    constructor(message: string="You already sent RSA Key", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.key = undefined
        } else {
            this.key = response.request.data.key
        }
    }

}

export class IncorrectPassword extends ClientError {
    readonly password: string | undefined;

    constructor(message: string="Incorrect password", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {
            this.password = undefined
        } else {
            this.password = response.request.data.password
        }
    }

}

export class NoServerResponse extends ServerError {

    constructor(message: string="The request was made but no response was received", request: any) {
        super(message, request);
    }

}

export const opcodeEnumeration = [
    NoToken,
    InvalidToken,
    UserNotFound,
    InvalidMessageLength,
    InvalidNicknameOrNameLength,
    InvalidPasswordLength,
    NameDoesntFitRegex,
    InvalidStatus,
    NoMessage,
    NoPermissionToEdit,
    NoPermissionToMarkAsRead,
    MessageAlreadyRead,
    InvalidLimit,
    AlreadyHaveConversation,
    DontHaveConversation,
    InvalidRsaKey,
    DidntCreatedConversation,
    AlreadySentKey,
    IncorrectPassword
]