import { perceptualToAmplitude } from "@discordapp/perceptual";
import { Client } from "discord-rpc";
import Store from "electron-store";
import { IPCListener, OnCommand, OnEvent, OnSettingsChange, Process } from "./common";
import { IpcClientEventData, IpcCommandData } from "./types";

@IPCListener
export class RPC extends Process {
	private client?: Client;
	private isConnecting = false;
	private store = new Store({
		name: "rpc",
		schema: {
			accessToken: {
				type: "string",
				default: "",
			},
			clientId: {
				type: "string",
				default: "",
			},
		},
	});

	create() {}

	async destroy() {
		if (!this.client) return;
		this.client.removeAllListeners();
		await this.client.destroy();
	}

	async connect(clientId: string, clientSecret?: string, accessToken?: string) {
		if (this.isConnecting) return;

		this.isConnecting = true;
		if (this.client) this.client.destroy().catch(() => {});
		this.client = new Client({ transport: "ipc" });

		try {
			if (!clientSecret && !accessToken) accessToken = this.store.get("accessToken") as string | undefined;

			if (!clientId || (!clientSecret && !accessToken)) {
				this.isConnecting = false;
				return;
			}

			await this.client.connect(clientId);
			await this.client.login({
				clientId,
				accessToken,
				clientSecret: accessToken ? undefined : clientSecret,
				redirectUri: "http://localhost",
				scopes: ["rpc"],
			});

			if (this.client && "accessToken" in this.client && this.client.accessToken) {
				accessToken = this.client.accessToken as string;
				this.client.on("disconnected", () => this.connect(clientId, clientSecret, accessToken));
				this.store.set("accessToken", accessToken);
				this.store.set("clientId", clientId);
			}

			this.isConnecting = false;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			if (err.code) {
				this.clearAccessToken();
				this.isConnecting = false;
				return;
			}

			await new Promise((r) => setTimeout(r, 7500));
			this.isConnecting = false;
			await this.connect(clientId, clientSecret, accessToken);
		}
	}

	@OnEvent("ready")
	async onLoaded(settings?: IpcClientEventData<"ready">) {
		if (!settings || !settings["discord.rpc"]) return;

		if (this.store.get("clientId") === settings["discord.rpcClientId"]) {
			await this.connect(settings["discord.rpcClientId"]);
		}

		if (!this.client?.user && settings["discord.rpcClientId"] && settings["discord.rpcClientSecret"]) {
			this.connect(settings["discord.rpcClientId"], settings["discord.rpcClientSecret"]);
		}
	}

	@OnSettingsChange("discord.rpcClientId")
	@OnSettingsChange("discord.rpcClientSecret")
	@OnEvent("logged-out")
	clearAccessToken() {
		this.store.clear();
	}

	@OnCommand("set-bot-volume")
	onSetBotVolume({ volume, id }: IpcCommandData<"set-bot-volume">) {
		if (!this.client) return;
		this.client.setUserVoiceSettings(id, {
			id,
			volume: perceptualToAmplitude(volume / 100) * 100,
		});
	}

	@OnCommand("authenticate-rpc")
	async onAuthenticateRPC({ clientId, clientSecret }: IpcCommandData<"authenticate-rpc">) {
		await this.connect(clientId, clientSecret);
	}
}

export const rpc = new RPC();
