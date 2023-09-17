import { AxiosResponse } from "axios";
import { UUID } from "crypto";
import { Socket } from "socket.io-client";

import { ErrorResponse } from "./types/http.js";
import { Token } from "./types/users.js";
import { ErrorOpcode } from "./types/errors.js";

export class ClientError extends Error {
    readonly response: AxiosResponse<ErrorResponse> | Socket | null;

    constructor(message: string, response: AxiosResponse<ErrorResponse> | Socket | null) {
        super(message);
        this.response = response
    }

}

export class ServerError extends Error {    
    readonly response: AxiosResponse | Socket | null;

    constructor(message: string, response: AxiosResponse | Socket | null) {
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
    readonly user: UUID | undefined = undefined;

    constructor(message: string="User not found", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.user = response.request.data.user
        }
    }

}

export class AvatarNotFound extends ClientError {
    readonly avatar: string | undefined = undefined;

    constructor(message: string="Avatar not found", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.avatar = response.request.params.hash
        }
    }

}

export class InvalidMessageLength extends ClientError {

    constructor(message: string="Your message must be no longer than 900 letters and not less than 1 letter", response: AxiosResponse | Socket) {
        super(message, response);
    }

}

export class InvalidPasswordLength extends ClientError {
    readonly password: string | undefined = undefined;

    constructor(message: string="Password length should be long than 8 characters", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.password = response.request.data.password
        }
    }

}

export class NameDoesntMatchRegex extends ClientError {
    readonly regex: RegExp;

    constructor(message: string ="Your name doesn't fit this regex: ^[a-zA-Z0-9_-]+${4, 255}", response: AxiosResponse | Socket) {
        super(message, response);
        this.regex = RegExp("^[a-zA-Z0-9_-]+${4, 255}");
    }

}

export class NicknameDoesntMatchRegex extends ClientError {
    readonly regex: RegExp;

    constructor(message: string = "Your nickname doesn't fit this regex: ^[a-zA-Z0-9_-]+${4, 255}", response: AxiosResponse | Socket) {
        super(message, response);
        this.regex = RegExp("^[a-zA-Z0-9_-]+${4, 255}");
    }

}

export class NameTaken extends ClientError {
    readonly nameInResponse: string | undefined = undefined;

    constructor(message: string="This name is already taken", response: AxiosResponse | Socket) {
        super(message, response)
        if (response instanceof Socket) {}
        else {
            this.name = response.data.name
        }
    }

}

export class InvalidStatus extends ClientError {

    constructor(message: string="There's only three statuses: online, do not disturb, hidden", response: AxiosResponse | Socket) {
        super(message, response);
    }

}

export class NoPermissionToEdit extends ClientError {
    readonly id: string | undefined = undefined;

    constructor(message: string="You can't edit this message", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.id = response.request.data.id
        }
    }

}


export class InvalidLimit extends ClientError {
    readonly limit: number | undefined = undefined;

    constructor(message: string="Limit should be more than 1 and less than 100", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.limit = response.request.params.limit
        }
    }

}

export class MessageNotFound extends ClientError {
    readonly messageId: string | undefined = undefined;

    constructor(message: string="Message not found", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.messageId = response.data.message
        }
    }

}

export class ConversationExists extends ClientError {
    readonly id: string | undefined = undefined;

    constructor(message: string="You have conversation with this user", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.id = response.request.data.user
        }
    }

}

export class ConversationNotReady extends ClientError {
    readonly user: string | undefined = undefined;

    constructor(message: string="One sides haven't sent the security key yet", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.user = response.request.data.user
        }
    }

}

export class NoConversation extends ClientError {
    readonly id: string | undefined = undefined;

    constructor(message: string="You don't have conversation with this user", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.id = response.request.data.user
        }
    }

}

export class InvalidRsaKey extends ClientError {
    readonly key: string | undefined = undefined;

    constructor(message: string="Invalid RSA Key", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.key = response.request.data.key
        }
    }

}

export class NoPermissionToSendKey extends ClientError {
    readonly key: string | undefined = undefined

    constructor(message: string="No permission to send key", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.key = response.request.data.key
        }
    }

}

export class IncorrectPassword extends ClientError {
    readonly password: string | undefined = undefined;

    constructor(message: string="Incorrect password", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.password = response.request.data.password
        }
    }

}

export class InvalidAvatarFormat extends ClientError {

    constructor(message: string="Avatars can be only jpeg or png", response: AxiosResponse | Socket) {
        super(message, response);
    }

}

export class InvalidAvatarSize extends ClientError {

    constructor(message: string="Max avatar size is 10mb", response: AxiosResponse | Socket) {
        super(message, response);
    }

}

export class InvalidMessageNumber extends ClientError {
    readonly length: number | undefined = undefined;

    constructor(message: string="You can only delete more than 2 and less than 100 messages in one request", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.length = response.request.data.messages.length
        }
    }
}

export class NoPermissionToDelete extends ClientError {
    readonly length: number | undefined = undefined;

    constructor(message: string="You can't delete this message", response: AxiosResponse | Socket) {
        super(message, response);
        if (response instanceof Socket) {}
        else {
            this.length = response.request.data.message
        }
    }
}

export class InvalidMessageId extends ClientError {
    readonly id: string | undefined = undefined;

    constructor(message: string ="One of the id is invalid: ", response: AxiosResponse | Socket) {
        if (response instanceof Socket) {
            super("One if the id is invalid", response);
        } else {
            const id = response.data.message.split(" ")[response.data.message.length - 1]
            super(message + id, response);
            this.id = id
        }
    }
}

export class NoServerResponse extends ServerError {

    constructor(message: string="The request was made but no response was received", request: any) {
        super(message, request);
    }

}

export const opcodeEnumeration: ErrorOpcode = {
    "NO_TOKEN": NoToken,
    "INVALID_TOKEN": InvalidToken,
    "NAME_DOESNT_MATCH_REGEX": NameDoesntMatchRegex,
    "NAME_TAKEN": NameTaken,
    "INCORRECT_PASSWORD": IncorrectPassword,
    "INVALID_AVATAR_FORMAT": InvalidAvatarFormat,
    "INVALID_AVATAR_SIZE": InvalidAvatarSize,
    "INVALID_STATUS": InvalidStatus,
    "NO_CONVERSATION": NoConversation,
    "USER_NOT_FOUND": UserNotFound,
    "AVATAR_NOT_FOUND": AvatarNotFound,
    "INVALID_SECURITY_KEY": InvalidRsaKey,
    "NO_PERMISSION_TO_SEND_KEY": NoPermissionToSendKey,
    "CONVERSATION_EXISTS": ConversationExists,
    "CONVERSATION_NOT_READY": ConversationNotReady,
    "INVALID_MESSAGE_LENGTH": InvalidMessageLength,
    "INVALID_LIMIT": InvalidLimit,
    "MESSAGE_NOT_FOUND": MessageNotFound,
    "NO_PERMISSION_TO_EDIT": NoPermissionToEdit,
    "INVALID_MESSAGE_NUMBER": InvalidMessageNumber,
    "NO_PERMISSION_TO_DELETE": NoPermissionToDelete,
}