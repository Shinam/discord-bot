const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('event')
        .setDescription('Replies with your input!')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Nom de l\'event')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('date')
				.setDescription('Date de l\'event')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('hour')
				.setDescription('Heure de l\'event')
				.setRequired(true)),
		async execute(interaction) {
			// Vérification du rôle "Membre"
			if (!interaction.member.roles.cache.some(role => role.name === 'Membre')) {
				return interaction.reply({ content: 'Vous n\'avez pas accès à cette commande.', ephemeral: true });
			}
			const nameOption = interaction.options.get('name');
			const hourOption = interaction.options.get('hour');
			const dayOption = interaction.options.get('date');

			if (!nameOption || !hourOption || !dayOption) {
				return await interaction.reply('Please provide all required options.');
			}

			const name = nameOption.value;
			const hour = hourOption.value;

			// Extraire le jour, le mois et l'année de la chaîne de date
			const [day, month] = interaction.options.getString('date').split('/');
		
			// Concaténer le mois et le jour dans l'ordre inverse, en ajoutant des zéros devant si nécessaire
			const newDateString = `${day.padStart(2, '0')}/${month.padStart(2, '0')}`;

		
			const newDate = invertDate(interaction.options.getString('date'))
			
			if (!isNaN(newDate)) {			
				// Obtenir le jour de la semaine de la date
				const dayOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][newDate.getDay()];
				const dateComplete = dayOfWeek + ' (' + newDateString + ')';
				// Envoyer la réponse
				const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(name)
				.setThumbnail('https://play-lh.googleusercontent.com/Gy53cjhEizh0ICsw3fhjHQWlphQYgfmJmtK8B7OyvRLJLesRrxzmTPphw80dPE5vtPs')
				.addFields(
					{ name: 'Information', value: 'Vous devez avoir un personnage de créé pour vous inscrire. /create pour créer ou modifier un personnage.' },
					{ name: 'Date', value: dateComplete},
					{ name: 'Heure', value: hour},
					{ name: 'Participants', value: '\n' }
				);
		  

				const row = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('participate')
						.setLabel('S\'inscrire')
						.setStyle(ButtonStyle.Primary),
						new ButtonBuilder()
						.setCustomId('unsubscribe')
						.setLabel('Se désinscrire')
						.setStyle(ButtonStyle.Danger)
				);
				const channel = interaction.client.channels.cache.find(channel => channel.name === 'events');
				const msg = await channel.send({ embeds: [embed], components: [row] });

				const heure = interaction.options.getString('hour');
				const fulldate = newDate.setHours(heure);

				// Formatage de la date et heure en format ISO
				
				//const isoDate = fulldate.toISOString();

				// Load existing data from JSON file
				let data = {};
				try {
					const jsonString = fs.readFileSync('./events.json', 'utf8');
					data = JSON.parse(jsonString);
				} catch (err) {
					console.log(err);
				}
				// Add new user profile data to JSON object
				data[msg.id] = {
					date: fulldate,
					name: name,
				}

				// Write updated data to JSON file
				fs.writeFileSync('./events.json', JSON.stringify(data));

				await interaction.reply({content: 'evenement ajouté', ephemeral: true });
			} else {
			  await interaction.reply('La date fournie est invalide');
			}

			//await interaction.reply(`Event created with the following details:\nName: ${name}\nHour: ${hour}\nDay: ${day}`);
	
		}

};

function invertDate(dateString) {
	// Extraire le jour, le mois et l'année de la chaîne de date
	const [day, month] = dateString.split('/');
  
	// Concaténer le mois et le jour dans l'ordre inverse, en ajoutant des zéros devant si nécessaire
	const newDateString = `${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
	// Obtenir la date actuelle
	const now = new Date();

	// Créer une nouvelle date à partir de la chaîne de date inversée
	const newDate = new Date(newDateString);
  
	// Vérifier si la date est valide
	if (!isNaN(newDate)) {
		// Utiliser la date actuelle pour obtenir l'année
		newDate.setFullYear(now.getFullYear());
	}
		console.log(newDate)
	// Retourner la nouvelle date
	return newDate;
  }

/*
		.addStringOption(option =>
			option.setName('day')
				.setDescription('Jour de l\'event')
				.setRequired(true)
				.addChoices(
					{ name: 'Lundi', value: 'Lundi' },
					{ name: 'Mardi', value: 'Mardi' },
					{ name: 'Mercredi', value: 'Mercredi' },
                    { name: 'Jeudi', value: 'Jeudi' },
					{ name: 'Vendredi', value: 'Vendredi' },
					{ name: 'Samedi', value: 'Samedi' },
                    { name: 'Dimanche', value: 'Dimanche' },
				)),

				*/