import { UUID } from "crypto";

import { Account, User } from "./users.js";
import { Token } from "./users.js";

type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
    ? Acc[number]
    : Enumerate<N, [...Acc, Acc['length']]>
type NumberRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>

export type Limit = NumberRange<0, 101>

export interface ErrorResponse {
    opcode: number;
    message: string;
};

export interface CreateClientOptions {
    keys?: Keys;
};

export interface HTTPResponse extends ErrorResponse {};

export interface UserResponse extends HTTPResponse, User {};

export interface AccountResponse extends HTTPResponse, Account{};

export interface CreateAccountResponse extends HTTPResponse {
    id: UUID;
    name: string;
    nickname: string;
    token: Token;
};

export interface Keys {
    [name: UUID]: {
        public: string;
        private: string;
    }
};