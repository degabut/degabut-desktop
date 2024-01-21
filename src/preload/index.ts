import type { Presence } from "discord-rpc";
import { contextBridge, ipcRenderer } from "electron";

interface DesktopAPI {
	onAuthenticated: () => void;
	onLoggedOut: () => void;
	onSettingsChanged: (key: string, after: unknown, before: unknown) => void;

	setActivity: (presence: Presence) => void;
	clearActivity: () => void;
	authenticateRpc: (clientId: string, clientSecret: string) => void;
	setBotVolume: (volume: number, id: string) => void;

	quitAndInstallUpdate: () => void;
	handleUpdateDownloaded: (callback: () => void) => void;
}

const appVersion = process.argv.find((arg) => arg.startsWith("--desktop-app-version="))?.split("=")[1];
const isMainWindow = process.argv.some((arg) => arg === "--main-window");

contextBridge.exposeInMainWorld("IS_DESKTOP", true);
contextBridge.exposeInMainWorld("DESKTOP_APP_VERSION", appVersion);

contextBridge.exposeInMainWorld("desktopAPI", <DesktopAPI>{
	onAuthenticated: () => ipcRenderer.send("authenticated"),
	onLoggedOut: () => ipcRenderer.send("logged-out"),
	onSettingsChanged: (...data: unknown[]) => ipcRenderer.send("settings-changed", ...data),

	setActivity: (...data: unknown[]) => ipcRenderer.send("set-activity", ...data),
	clearActivity: () => ipcRenderer.send("clear-activity"),
	authenticateRpc: (...data: unknown[]) => ipcRenderer.send("authenticate-rpc", ...data),
	setBotVolume: (...data: unknown[]) => ipcRenderer.send("set-bot-volume", ...data),

	quitAndInstallUpdate: () => ipcRenderer.send("quit-and-install-update"),
	handleUpdateDownloaded: (callback: () => void) => ipcRenderer.on("update-downloaded", callback),
});

process.once("loaded", () => {
	if (!isMainWindow) return;

	const settings = localStorage.getItem("settings");
	ipcRenderer.send("loaded", settings ? JSON.parse(settings) : null);
	let reloading = false;

	window.addEventListener("load", () => {
		reloading = false;
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "F5" && !reloading) {
			reloading = true;
			ipcRenderer.send("f5-pressed");
		}
	});

	window.addEventListener("beforeunload", () => {
		document.body.classList.add("opacity-50", "pointer-events-none", "bg-black");
	});
});
