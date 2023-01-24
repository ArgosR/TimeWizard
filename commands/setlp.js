const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setlp')
		.setDescription('modifie les LP du joueur'),
	async execute(interaction) {
		await interaction.reply('LP modifiés !');
	},
};
