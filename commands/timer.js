const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('timer')
		.setDescription('Affiche le temps'),
	async execute(interaction) {
		await interaction.reply('Il reste X minutes');
	},
};
