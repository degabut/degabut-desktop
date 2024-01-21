import { app, BrowserWindow } from "electron";
import { appTray } from "./app-tray";
import { config } from "./config";
import { mainWindow } from "./main-window";
import { overlayWindow } from "./overlay-window";
import { richPresence } from "./rich-presence";
import { rpc } from "./rpc";
import { updater } from "./updater";

app.setAppUserModelId("com.squirrel.degabut.Degabut");

const main = () => {
	if (require("electron-squirrel-startup")) return app.quit();
	const hasLock = app.requestSingleInstanceLock();
	if (!hasLock) return app.quit();

	app.commandLine.appendSwitch("disable-http-cache");

	// handle second
	app.on("second-instance", () => {
		if (!mainWindow.window) return;
		mainWindow.window.show();
	});

	app.whenReady().then(async () => {
		await config.initialize();
		const processes = [mainWindow, overlayWindow, appTray, rpc, richPresence, updater];

		let cleared = false;
		app.on("before-quit", async (e) => {
			if (cleared) return;

			e.preventDefault();
			try {
				await Promise.all(processes.map((p) => p.destroy()));
			} catch {
				/* ignore */
			}
			cleared = true;
			app.quit();
		});
		processes.forEach((process) => process.create());

		app.on("activate", () => {
			if (BrowserWindow.getAllWindows().length === 0) mainWindow.create();
		});
	});

	app.on("window-all-closed", () => {
		if (process.platform !== "darwin") app.quit();
	});
};

main();
