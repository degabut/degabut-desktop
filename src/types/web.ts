export type Settings = {
	["botIndex"]: number;
	["botVolumes"]: Record<string, number>;
	["queue.showThumbnail"]: boolean;
	["notification.browser"]: boolean;
	["notification.inApp"]: boolean;
	["discord.richPresence"]: boolean;
	["discord.rpc"]: boolean;
	["discord.rpcClientId"]: string;
	["discord.rpcClientSecret"]: string;
	["app.drawerSize"]: number;
	["app.textSize"]: number;
	["app.snowfall.enabled"]: boolean;
	["app.snowfall.amount"]: number;
	["app.snowfall.speed"]: number;
	["overlay.enabled"]: boolean;
	["overlay.shortcut"]: string[];
};
