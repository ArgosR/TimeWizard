const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription('remet à 8000 les LP des deux joueurs de la partie sans toucher au timer'),
	async execute(interaction) {
		await interaction.reply('Partie reset!');
	},
};
