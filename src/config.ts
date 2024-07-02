import { readFile } from "fs/promises";
import { join } from "path";

type ConfigSchema = {
	clientId: string;
	baseUrl: string;
	update: { name: string; repository: string };
};

class Config implements ConfigSchema {
	clientId = "";
	baseUrl = "";
	update: { name: string; repository: string } = {
		name: "",
		repository: "",
	};

	async initialize() {
		const configFile = await readFile(join(__dirname, "./config.json"), "utf8");
		const config = JSON.parse(configFile) as ConfigSchema;

		this.clientId = config.clientId;
		this.baseUrl = config.baseUrl;
		this.update = config.update;
	}

	get icon() {
		return join(__dirname, "./assets/favicon.ico");
	}

	get icon32() {
		return join(__dirname, "./assets/favicon-32x32.png");
	}
}

export const config = new Config();
