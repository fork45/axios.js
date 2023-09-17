import { CreateClientOptions } from "./http";
import { CreateSocketOptions } from "./socket";

export interface ConnectionOptions extends CreateClientOptions, CreateSocketOptions {}