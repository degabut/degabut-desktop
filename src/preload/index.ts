import { contextBridge, ipcRenderer } from "electron";
import { DesktopAPI, IpcClientEvents, IpcCommandData, IpcCommands, IpcServerEventPayload } from "../types";

const appVersion = process.argv.find((arg) => arg.startsWith("--desktop-app-version="))?.split("=")[1];
const isMainWindow = process.argv.some((arg) => arg === "--main-window");

const sendCommand = async <T extends keyof IpcCommands>(name: T, data?: IpcCommandData<T>) => {
	return ipcRenderer.invoke("command", { name, data });
};

const sendEvent = <T extends keyof IpcClientEvents>(name: T, data: IpcClientEvents[T]) => {
	ipcRenderer.send("event", { name, data });
};

contextBridge.exposeInMainWorld("IS_DESKTOP", true);
contextBridge.exposeInMainWorld("DESKTOP_APP_VERSION", appVersion);
contextBridge.exposeInMainWorld("desktopAPI", <DesktopAPI>{
	send: sendCommand,
	emit: sendEvent,
	on: (eventName: string, callback: (e: unknown) => void) => {
		if (!listeners.has(eventName)) listeners.set(eventName, []);
		listeners.get(eventName)?.push(callback);
	},
});

const listeners = new Map<string, ((e: unknown) => void)[]>();
ipcRenderer.on("event", (_, e: IpcServerEventPayload) => {
	const listener = listeners.get(e.name);
	if (listener) listener.forEach((l) => l(e.data));
});

process.once("loaded", () => {
	if (!isMainWindow) return;

	const settings = localStorage.getItem("settings");
	sendEvent("ready", settings ? JSON.parse(settings) : null);
	let reloading = false;

	window.addEventListener("load", () => {
		reloading = false;
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "F5" && !reloading) {
			reloading = true;
			sendCommand("reload");
		}
	});

	window.addEventListener("beforeunload", () => {
		document.body.classList.add("opacity-50", "pointer-events-none", "bg-black");
	});
});
