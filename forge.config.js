const config = require("./config.json");

module.exports = {
	packagerConfig: {
		name: "Degabut",
		icon: "./src/assets/favicon.ico",
	},
	rebuildConfig: {},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				name: "degabut",
				title: "Degabut",
				setupIcon: "./src/assets/favicon.ico",
				loadingGif: "./src/assets/loading.gif",
				iconUrl: config.baseUrl + "/favicon.ico",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: ["darwin"],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {},
		},
	],
};
