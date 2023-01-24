const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('end')
		.setDescription('Termine la partie en cours'),
	async execute(interaction) {
		await interaction.reply('Fin de la partie');
	},
};
