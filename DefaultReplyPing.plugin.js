/**
 * @name DefaultReplyPing
 * @invite undefined
 * @authorLink undefined
 * @donate undefined
 * @patreon undefined
 * @website https://github.com/asportnoy/defaultreplyping-betterdiscord
 * @source https://raw.githubusercontent.com/asportnoy/defaultreplyping-betterdiscord/main/DefaultReplyPing.plugin.js
 */
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

module.exports = (() => {
	const config = {
		info: {
			name: 'DefaultReplyPing',
			authors: [{name: 'asportnoy', discord_id: '489484338514100234'}],
			version: '1.0.6',
			description: 'Set a reply ping default per-server',
			github: 'https://github.com/asportnoy/defaultreplyping',
			github_raw:
				'https://raw.githubusercontent.com/asportnoy/defaultreplyping/main/DefaultReplyPing.plugin.js',
		},
		changelog: [
			{
				title: 'New Stuff',
				items: ['Reply pings will always be disabled in DMs'],
			},
			{
				title: 'Bug Fixes',
				type: 'fixed',
				items: [
					'Reply pings will always be disabled for your own messages',
				],
			},
		],
		main: 'index.js',
	};

	return !global.ZeresPluginLibrary
		? class {
				constructor() {
					this._config = config;
				}
				getName() {
					return config.info.name;
				}
				getAuthor() {
					return config.info.authors.map(a => a.name).join(', ');
				}
				getDescription() {
					return config.info.description;
				}
				getVersion() {
					return config.info.version;
				}
				load() {
					BdApi.showConfirmationModal(
						'Library Missing',
						`The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`,
						{
							confirmText: 'Download Now',
							cancelText: 'Cancel',
							onConfirm: () => {
								require('request').get(
									'https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js',
									async (error, response, body) => {
										if (error)
											return require('electron').shell.openExternal(
												'https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js',
											);
										await new Promise(r =>
											require('fs').writeFile(
												require('path').join(
													BdApi.Plugins.folder,
													'0PluginLibrary.plugin.js',
												),
												body,
												r,
											),
										);
									},
								);
							},
						},
					);
				}
				start() {}
				stop() {}
		  }
		: (([Plugin, Api]) => {
				const plugin = (Plugin, Library) => {
					const {
						Patcher,
						Logger,
						Settings,
						WebpackModules,
						DiscordModules,
						DiscordAPI,
					} = Library;
					return class DefaultReplyPing extends Plugin {
						constructor() {
							super();
							this.defaultSettings = {};
							this.defaultSettings.override = '';
							this.defaultSettings.default = true;
						}

						onStart() {
							Patcher.before(
								WebpackModules.getByProps('createPendingReply'),
								'createPendingReply',
								(t, a) => {
									const currentGuild =
										DiscordModules.SelectedGuildStore.getGuildId();
									const currentUser =
										DiscordModules.UserStore.getCurrentUser()
											.id;

									const replyUser = a[0]?.message?.author?.id;

									const defaultSetting =
										this.settings.default;
									const isGuildOverride =
										currentGuild &&
										this.settings.override
											.split(' ')
											.includes(currentGuild);
									const isCurrentUser =
										currentUser == replyUser;

									let result = defaultSetting;
									if (isCurrentUser || !currentGuild) {
										result = false;
									} else {
										if (isGuildOverride) {
											result = !defaultSetting;
										}
									}
									a[0].shouldMention = result;
								},
							);
						}

						onStop() {
							Patcher.unpatchAll();
						}

						getSettingsPanel() {
							return Settings.SettingPanel.build(
								this.saveSettings.bind(this),
								new Settings.SettingGroup(
									'Reply Ping Settings',
									{shown: true},
								).append(
									new Settings.Dropdown(
										'Default',
										"If the server doesn't have an override, this will be used.",
										this.settings.default,
										[
											{
												label: 'On',
												value: true,
											},
											{
												label: 'Off',
												value: false,
											},
										],
										e => {
											this.settings.default = e;
										},
									),
									new Settings.Textbox(
										'Override list',
										'These servers will do the opposite of the default option. This should be a list of server IDs separated by spaces.',
										this.settings.override,
										e => {
											this.settings.override = e;
										},
									),
								),
							);
						}
					};
				};
				return plugin(Plugin, Api);
		  })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/
