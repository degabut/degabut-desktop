import { BrowserWindow, globalShortcut, shell } from "electron";
import * as path from "path";
import { IPCListener, OnIpc, OnSettingsChange, Window } from "./common";
import { config } from "./config";
import { Settings } from "./types";

@IPCListener
class OverlayWindow extends Window {
	private isEnabled = false;
	private isOverlayClosed = true;
	private currentShortcut = "";

	create(): void {
		this.window = new BrowserWindow({
			webPreferences: {
				preload: path.join(__dirname, "./preload/index.js"),
			},
			autoHideMenuBar: true,
			transparent: true,
			fullscreen: true,
			skipTaskbar: true,
			alwaysOnTop: true,
			frame: false,
			show: false,
			resizable: false,
		});

		this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
		this.window.setAlwaysOnTop(true, "screen-saver", 1);
		this.window.setFullScreenable(false);

		this.window.on("blur", () => {
			this.closeOverlay();
			this.isOverlayClosed = true;
		});

		this.window.webContents.setWindowOpenHandler(({ url }) => {
			shell.openExternal(url);
			return { action: "deny" };
		});

		this.window.loadURL(`${config.baseUrl}/desktop-overlay`);
	}

	destroy() {
		if (this.window?.isDestroyed()) return;
		this.window?.destroy();
	}

	// #region IPC
	@OnIpc("main-window-loaded")
	onMainWindowLoaded() {
		this.window.webContents.reload();
	}

	@OnIpc("loaded")
	onLoaded(settings?: Settings) {
		if (!settings) return;
		if (settings["overlay.enabled"]) this.onOverlayToggled(settings["overlay.enabled"]);
		if (settings["overlay.shortcut"]) this.onOverlayShortcutChanged(settings["overlay.shortcut"]);
	}

	@OnIpc("authenticated")
	onAuthenticated() {
		this.window.webContents.reload();
	}

	@OnSettingsChange("overlay.enabled")
	onOverlayToggled(isEnabled: boolean) {
		this.isEnabled = isEnabled;
		if (!this.currentShortcut) return;

		if (!isEnabled && globalShortcut.isRegistered(this.currentShortcut)) {
			globalShortcut.unregister(this.currentShortcut);
		} else if (!globalShortcut.isRegistered(this.currentShortcut)) {
			globalShortcut.register(this.currentShortcut, () => this.toggleOverlay());
		}
	}

	@OnSettingsChange("overlay.shortcut")
	onOverlayShortcutChanged(keys: string[]) {
		const shortcut = keys
			.map((key: string) => {
				if (key === "Control" || key === "Command") return "CommandOrControl";
				return key;
			})
			.join("+");

		if (shortcut && this.currentShortcut === shortcut) return;

		if (this.currentShortcut && globalShortcut.isRegistered(this.currentShortcut)) {
			globalShortcut.unregister(this.currentShortcut);
		}

		if (this.isEnabled) {
			globalShortcut.register(shortcut, () => this.toggleOverlay());
		}
		this.currentShortcut = shortcut;
	}
	// #endregion

	// #region toggle overlay
	private toggleOverlay() {
		this.isOverlayClosed ? this.openOverlay() : this.closeOverlay();
	}

	private openOverlay() {
		globalShortcut.register("Esc", () => this.closeOverlay());
		this.window.show();
		this.window.restore();
		this.isOverlayClosed = false;
	}

	private closeOverlay() {
		if (this.window.isDestroyed()) return;
		globalShortcut.unregister("Esc");
		this.window.minimize();
		this.window.hide();
		this.isOverlayClosed = true;
	}
	// #endregion
}

export const overlayWindow = new OverlayWindow();
