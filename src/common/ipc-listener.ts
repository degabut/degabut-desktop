/* eslint-disable @typescript-eslint/no-explicit-any */
import { ipcMain } from "electron";

const IpcListeners = Symbol("IpcListeners");
const SettingsChangeListeners = Symbol("SettingsChangeListeners");

export function IPCListener<T extends { new (...args: any[]): any }>(Base: T) {
	return class extends Base {
		constructor(...args: any[]) {
			super(...args);

			const ipcListeners = Base.prototype[IpcListeners];
			if (ipcListeners) {
				ipcListeners.forEach((event: string, method: string) => {
					ipcMain.on(event, (_, ...args) => this[method](...args));
				});
			}

			const settingsChangeListeners = Base.prototype[SettingsChangeListeners];
			if (settingsChangeListeners) {
				settingsChangeListeners.forEach((settings: string, method: string) => {
					ipcMain.on("settings-changed", (_, key: string, after: any, before: any) => {
						if (key === settings) this[method](after, before);
					});
				});
			}
		}
	};
}

export function OnIpc(event: string) {
	return function (target: any, propertyKey: string) {
		target[IpcListeners] = target[IpcListeners] || new Map();
		target[IpcListeners].set(propertyKey, event);
	};
}

export function OnSettingsChange(settings: string) {
	return function (target: any, propertyKey: string) {
		target[SettingsChangeListeners] = target[SettingsChangeListeners] || new Map();
		target[SettingsChangeListeners].set(propertyKey, settings);
	};
}
