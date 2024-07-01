import { BrowserWindow, ipcMain } from "electron";
import { IpcInternalEvents, IpcServerEvents } from "../types";
import { Process } from "./process";

export abstract class Window extends Process {
	window!: BrowserWindow;

	send<T extends keyof IpcServerEvents>(name: T, data?: IpcServerEvents[T]): void {
		this.window?.webContents.send("event", { name, data });
	}

	emit<T extends keyof IpcInternalEvents>(name: T, data?: IpcInternalEvents[T]): void {
		ipcMain.emit(name, null, data);
	}
}
