import { BrowserWindow, app, autoUpdater, shell } from "electron";
import * as path from "path";
import { IPCListener, OnCommand, Window } from "./common";
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

		this.window.on("focus", () => this.emit("main-window-focus-state-change", true));
		this.window.on("blur", () => this.emit("main-window-focus-state-change", false));

		this.window.webContents.on("did-finish-load", () => {
			const url = this.window?.webContents.getURL();
			if (url.startsWith(config.baseUrl)) this.emit("main-window-loaded");
		});

		this.window.webContents.setWindowOpenHandler(({ url }) => {
			shell.openExternal(url);
			return { action: "deny" };
		});

		this.window.setMenuBarVisibility(false);

		await this.window.loadURL(config.baseUrl);

		autoUpdater.on("update-downloaded", () => {
			this.send("update-downloaded");
		});
	}

	destroy() {
		this.window?.destroy();
	}

	@OnCommand("reload")
	reload() {
		this.window.webContents.reload();
	}
}

export const mainWindow = new MainWindow();
