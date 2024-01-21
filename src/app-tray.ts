import { Menu, Tray, app } from "electron";
import { Process } from "./common";
import { config } from "./config";
import { mainWindow } from "./main-window";
import { overlayWindow } from "./overlay-window";

class AppTray extends Process {
	private tray!: Tray;

	create() {
		this.tray = new Tray(config.icon);
		this.tray.on("click", () => mainWindow?.window.show());
		this.tray.setContextMenu(
			Menu.buildFromTemplate([
				{
					label: "Show",
					click: () => mainWindow?.window.show(),
				},
				{
					label: "Reload",
					click: () => {
						mainWindow?.window.webContents.reload();
						overlayWindow?.window.webContents.reload();
					},
				},
				{
					label: "Quit",
					click: () => app.quit(),
				},
			])
		);
	}

	destroy() {
		this.tray?.destroy();
	}
}

export const appTray = new AppTray();
