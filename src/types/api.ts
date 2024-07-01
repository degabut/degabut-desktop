import type { Presence } from "discord-rpc";
import { Settings } from "./web";

export interface DesktopAPI {
	send: <T extends keyof IpcCommands>(eventName: T, payload?: IpcCommands[T][0]) => IpcCommands[T][1];
	emit: <T extends keyof IpcClientEvents>(name: T, data?: IpcClientEvents[T]) => void;
	on: <T extends keyof IpcServerEvents>(eventName: T, callback: (e: IpcServerEvents[T]) => void) => void;
}

export type IpcServerEvents = {
	"overlay-active-state-change": boolean;
	"main-window-focus-state-change": boolean;
	"update-downloaded": boolean;
};
export type IpcServerEventData<T extends keyof IpcServerEvents> = IpcServerEvents[T];
export type IpcServerEventPayload<T extends keyof IpcServerEvents = keyof IpcServerEvents> = {
	name: T;
	data: IpcServerEventData<T>;
};

export type IpcClientEvents = {
	ready: Settings | null;
	authenticated: void;
	"logged-out": void;
	"overlay-ready": void;
	"settings-changed": { key: keyof Settings; value: unknown; previous: unknown };
};
export type IpcClientEventData<T extends keyof IpcClientEvents> = IpcClientEvents[T];
export type IpcClientEventsPayload<T extends keyof IpcClientEvents = keyof IpcClientEvents> = {
	name: T;
	data: IpcClientEventData<T>;
};

export type IpcCommands = {
	reload: [void];
	"quit-and-install-update": [void];
	"set-activity": [Presence];
	"clear-activity": [void];
	"set-bot-volume": [{ volume: number; id: string }];
	"authenticate-rpc": [{ clientId: string; clientSecret: string }];
};
export type IpcCommandData<T extends keyof IpcCommands> = IpcCommands[T][0];
export type IpcCommandResponse<T extends keyof IpcCommands> = IpcCommands[T][1];

export type IpcCommandPayload<T extends keyof IpcCommands = keyof IpcCommands> = {
	name: T;
	data: IpcCommandData<T>;
};

export type IpcInternalEvents = {
	"main-window-loaded": void;
	"main-window-focus-state-change": boolean;
};
