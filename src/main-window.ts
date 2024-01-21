import { BrowserWindow, app, autoUpdater, ipcMain, shell } from "electron";
import * as path from "path";
import { IPCListener, OnIpc, Window } from "./common";
import { config } from "./config";

@IPCListener
class MainWindow extends Window {
	async create() {
		this.window = new BrowserWindow({
			webPreferences: {
				preload: path.join(__dirname, "./preload/index.js"),
				additionalArguments: [`--desktop-app-version=${app.getVersion()}`, "--main-window"],
			},
			height: 720,
			width: 1024,
			minWidth: 480,
			minHeight: 512,
			icon: config.icon,
			frame: false,
			backgroundColor: "#1e1e1e",
			titleBarStyle: "hidden",
			titleBarOverlay: {
				color: "#1e1e1e",
				height: 32,
				symbolColor: "#fff",
			},
		});

		this.window.on("close", (event) => {
			event.preventDefault();
			this.window.hide();
			event.returnValue = false;
		});

		this.window.webContents.on("did-finish-load", () => {
			const url = this.window?.webContents.getURL();
			if (url.startsWith(config.baseUrl)) ipcMain.emit("main-window-loaded");
		});

		this.window.webContents.setWindowOpenHandler(({ url }) => {
			shell.openExternal(url);
			return { action: "deny" };
		});

		this.window.setMenuBarVisibility(false);

		await this.window.loadURL(config.baseUrl);

		autoUpdater.on("update-downloaded", () => {
			this.window?.webContents.send("update-downloaded");
		});
	}

	destroy() {
		this.window?.destroy();
	}

	@OnIpc("f5-pressed")
	onF5Pressed() {
		this.window.webContents.reload();
	}
}

export const mainWindow = new MainWindow();
