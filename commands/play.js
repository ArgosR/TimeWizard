const { SlashCommandBuilder } = require('discord.js');
//const joueur1 { userProfile } =;
//const joueur2 { userProfile } =;
const Temps { int } = 40;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('lance une partie entre "joueur1" et "joueur2" avec le "temps" demandé')
		.addUserOption(option =>
		option.setName('input')
			.setDescription('joueur1')
			.setRequired(true)),
			
	
			
	async execute(interaction) {
		await interaction.reply('Partie lancée (enfin pas encore là mais ça arrive)avec'+option.get()+'!');
	},
};
