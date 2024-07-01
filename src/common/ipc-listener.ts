/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcMain } from "electron";
import { EventEmitter } from "node:events";
import {
	IpcClientEventData,
	IpcClientEvents,
	IpcClientEventsPayload,
	IpcCommandPayload,
	IpcCommands,
	IpcInternalEvents,
	Settings,
} from "../types";

const IpcInternalEventListeners = Symbol("IpcInternalEventListeners");
const IpcClientEventListeners = Symbol("IpcClientEventListeners");
const IpcCommandListeners = Symbol("IpcCommandListeners");
const SettingsChangeListeners = Symbol("SettingsChangeListeners");

type ListenerCollection = Map<string, string[]>;

const commandEmitter = new EventEmitter();

ipcMain.handle("command", (_, cmd: IpcCommandPayload) => {
	commandEmitter.emit("command", cmd);
});

export function IPCListener<T extends { new (...args: any[]): any }>(Base: T) {
	return class extends Base {
		constructor(...args: any[]) {
			super(...args);

			const ipcInternalEventListeners: ListenerCollection = Base.prototype[IpcInternalEventListeners];
			if (ipcInternalEventListeners) {
				ipcInternalEventListeners.forEach((methods, event) => {
					ipcMain.on(event, (_, ...args) => {
						methods.forEach((method) => this[method](...args));
					});
				});
			}

			const ipcCommandListeners: ListenerCollection = Base.prototype[IpcCommandListeners];
			if (ipcCommandListeners?.size) {
				commandEmitter.on("command", (cmd: IpcCommandPayload) => {
					const methods = ipcCommandListeners.get(cmd.name);
					if (methods) methods.forEach((method) => this[method](cmd.data));
				});
			}

			const settingsChangeListeners: ListenerCollection = Base.prototype[SettingsChangeListeners];
			const clientEventListener: ListenerCollection = Base.prototype[IpcClientEventListeners];

			if (settingsChangeListeners?.size || clientEventListener?.size) {
				ipcMain.on("event", (_, event: IpcClientEventsPayload) => {
					if (event.name === "settings-changed") {
						const { key, value, previous } = event.data as IpcClientEventData<"settings-changed">;
						const methods = settingsChangeListeners.get(key);
						if (methods) methods.forEach((method) => this[method](value, previous));
					}

					if (clientEventListener) {
						const methods = clientEventListener.get(event.name);
						if (methods) methods.forEach((method) => this[method](event.data));
					}
				});
			}
		}
	};
}

export function OnIpc(event: keyof IpcInternalEvents) {
	return function (target: any, propertyKey: string) {
		setTargetListener(target, IpcInternalEventListeners, event, propertyKey);
	};
}

export function OnCommand(command: keyof IpcCommands) {
	return function (target: any, propertyKey: string) {
		setTargetListener(target, IpcCommandListeners, command, propertyKey);
	};
}

export function OnEvent(event: keyof IpcClientEvents) {
	return function (target: any, propertyKey: string) {
		setTargetListener(target, IpcClientEventListeners, event, propertyKey);
	};
}

export function OnSettingsChange(settingKey: keyof Settings) {
	return function (target: any, propertyKey: string) {
		setTargetListener(target, SettingsChangeListeners, settingKey, propertyKey);
	};
}

const setTargetListener = (target: any, symbol: symbol, key: string, propertyKey: string) => {
	target[symbol] = target[symbol] || new Map();
	const listeners: ListenerCollection = target[symbol];
	if (!listeners.has(key)) listeners.set(key, []);
	listeners.get(key)?.push(propertyKey);
};
