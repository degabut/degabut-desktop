import axios from "axios";
import { app, autoUpdater } from "electron";
import { IPCListener, OnCommand, Process } from "./common";
import { config } from "./config";

@IPCListener
class Updater extends Process {
	private hasUpdate = false;

	create(): void {
		if (!app.isPackaged) return;
		autoUpdater.on("error", console.error);
		autoUpdater.on("update-downloaded", () => {
			this.hasUpdate = true;
		});

		this.checkUpdate();
		setInterval(() => this.checkUpdate(), 5 * 60 * 1000);
	}

	destroy() {}

	@OnCommand("quit-and-install-update")
	quitAndInstall() {
		if (this.hasUpdate) autoUpdater.quitAndInstall();
	}

	private async checkUpdate() {
		const { name, repository } = config.update;

		const response = await axios.get(`https://api.github.com/repos/${name}/${repository}/releases/latest`);

		const tagName = response.data.tag_name;
		if (!tagName) return;

		autoUpdater.setFeedURL({
			url: `https://github.com/${name}/${repository}/releases/download/${tagName}`,
		});

		autoUpdater.checkForUpdates();
	}
}

export const updater = new Updater();
