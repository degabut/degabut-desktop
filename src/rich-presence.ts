import { Client, Presence } from "discord-rpc";
import { IPCListener, OnIpc, Process } from "./common";
import { config } from "./config";

@IPCListener
export class RichPresence extends Process {
	private client?: Client;

	create() {
		this.connect();
	}

	async destroy() {
		if (!this.client) return;
		this.client.removeAllListeners();
		await this.client.destroy();
	}

	async connect() {
		if (this.client) this.client.destroy().catch(() => {});
		this.client = new Client({ transport: "ipc" });

		try {
			await this.client.connect(config.clientId);
			this.client.on("disconnected", () => this.connect());
		} catch (err) {
			await new Promise((r) => setTimeout(r, 7500));
			await this.connect();
		}
	}

	@OnIpc("set-activity")
	setActivity(data: Presence) {
		if (!this.client?.user) return;
		this.client?.setActivity(data);
	}

	@OnIpc("clear-activity")
	onClearActivity() {
		if (!this.client?.user) return;
		this.client?.clearActivity();
	}
}

export const richPresence = new RichPresence();
