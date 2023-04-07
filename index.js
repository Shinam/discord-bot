require("dotenv").config();
// Require the necessary discord.js classes
const schedule = require('node-schedule');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const prefix = '!'
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
	console.log('Ready!');
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton()) return;

	if (interaction.customId === 'participate') {
		// Vérification des données de l'utilisateur
		delete require.cache[require.resolve('./profiles.json')];
		const profiles = require('./profiles.json');
		const userProfile = profiles[interaction.user.id];
		console.log(userProfile)

		if (userProfile) {
			// Get the message embed from the button's message
			const message = interaction.message;
			const embed = message.embeds[0];

			// Check if the user has already participated in the event
			const existingParticipant = embed.fields.find(field => field.name === 'Participants' && field.value.includes(userProfile.username));

			if (existingParticipant) {
				// User has already participated
				interaction.reply({ content: `Tu est déjà inscrit à cet évènement !`, ephemeral: true, });
			} else {
				// Récupère l'id de l'utilisateur qui a cliqué sur le bouton
				const userId = interaction.user.id;

				// Récupère l'id de l'événement à partir de l'interaction
				const eventId = interaction.message.id;

				// Lit le contenu du fichier JSON
				const events = JSON.parse(fs.readFileSync('./events.json'));

				// Récupère l'objet de l'événement correspondant à l'id
				const event = events[eventId];

				// Vérifie si l'événement existe
				if (!event) {
					return console.error(`L'événement avec l'id ${eventId} n'existe pas.`);
				}

				// Vérifie si la liste des participants existe
				if (!event.participants) {
					event.participants = [];
				}

				// Vérifie si l'utilisateur n'a pas déjà participé à l'événement
				if (event.participants.includes(userId)) {
					return interaction.reply({ content: `Tu es déjà inscrit.`, ephemeral: true, });
				}

				// User has not participated yet
				// Update the "Participants" field with the user's data
				const participantsField = embed.fields.find(field => field.name === 'Participants');
				const currentParticipants = participantsField.value;
				const newParticipants = currentParticipants + `\n- ${userProfile.username} (**${userProfile.classe}** niveau **${userProfile.level})**`;
				participantsField.value = newParticipants;

				// Edit the message with the updated embed
				message.edit({ embeds: [embed] });

				// Ajoute l'id de l'utilisateur à la liste des participants
				event.participants.push(userId);

				// Enregistre l'objet modifié dans le fichier JSON
				fs.writeFileSync('./events.json', JSON.stringify(events, null, 2));


				// Respond to the interaction
				await interaction.reply({
					content: 'Tu es désormais inscrit à l\'évènement!',
					ephemeral: true,
				});
			}
		} else {
			// User has not set their profile data
			interaction.reply({ content: `Tu dois d'abord créer ton profil en utilisant la commande "/create".`, ephemeral: true, });
		}
	}
	if (interaction.customId === "unsubscribe") {
		// Get the message embed from the button's message
		const message = interaction.message;

		// Récupération du champ Participants et de la liste des participants actuels
		const field = message.embeds[0].fields.find(field => field.name === 'Participants');
		const currentParticipants = field.value.split('\n');

		const eventId = message.id;
		const events = require('./events.json');
		const event = events[eventId];

		const participantIndex = event.participants[interaction.user.id];

		if (participantIndex === -1) {
			return interaction.reply({
				content: 'Tu n\'es pas inscrit à cet événement !',
				ephemeral: true
			});
		}

		event.participants.splice(participantIndex, 1);
		fs.writeFileSync('./events.json', JSON.stringify(events, null, 2));


		// Vérification si l'utilisateur est déjà inscrit et suppression de sa participation
		const userId = interaction.user.username;
		const index = currentParticipants.findIndex(participant => participant.includes(userId));
		if (index !== -1) {
			currentParticipants.splice(index, 1);
		}
		else {
			interaction.reply({ content: 'Tu n\'es pas inscrit à l\'événement.', ephemeral: true });
			return;
		}

		// Mise à jour du champ Participants de l'embed
		const newParticipants = currentParticipants.join('\n');
		message.embeds[0].fields.find(field => field.name === 'Participants').value = newParticipants;

		// Mise à jour du message avec l'embed modifié et la nouvelle rangée de boutons
		await message.edit({ embeds: [message.embeds[0]] });

		// Réponse à l'utilisateur qui a cliqué sur le bouton
		interaction.reply({ content: 'Tu as été désinscrit de l\'événement.', ephemeral: true });


	}
});

async function getReady(){
	delete require.cache[require.resolve('./events.json')];
	const events = require('./events.json');

	// Transforme l'objet unique en un tableau contenant l'objet
	//const eventArray = Object.keys(events).map(key => events[key]);
	const eventArray = Object.entries(events).map(([key, value]) => {
		// Ajouter la clé à l'objet pour la référence ultérieure
		value.id = key;
		return value;
	});
	const now = new Date();

	//console.log(eventArray);

	for (const event of eventArray) {
		const eventDate = new Date(event.date);
		const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
		const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
		const participantIDs = event.participants;
		const channel = client.channels.cache.find(channel => channel.name === 'events');

		// Vérifie si l'événement est prévu pour l'heure suivante ou celle d'après
		if (eventDate > now && eventDate <= nextHour) {
			// Création de la liste des mentions des participants
			const mentionString = participantIDs.map(id => `<@${id}>`).join(' '); // Création de la chaîne de mentions
			const reponse = `Rappel : l'événement "${event.name}" commence à ${eventDate.getHours()} heures ! ${mentionString}`;
			try {
				await channel.send(reponse);
			}
			catch(error) {
				console.error(error)
			}

		} else if (is24HoursLater(now, eventDate)) {
			const mentionString = participantIDs.map(id => `<@${id}>`).join(' '); // Création de la chaîne de mentions
			const reponse = `Rappel : l'événement "${event.name}" commence dans 24 heures ! ${mentionString}`;
			try {
				await channel.send(reponse);
			}
			catch(error) {
				console.error(error)
			}
		}
	}
}

function is24HoursLater(date1, date2) {
	const diff = date2 - date1;
	const diffInHours = diff / 1000 / 60 / 60;
	return diffInHours >= 24 && diffInHours < 25;
}

// Fonction pour supprimer les événements antérieurs à la date actuelle
async function removeOldEvents() {
	let events = {};
	const jsonString = fs.readFileSync('./events.json', 'utf8');
	events = JSON.parse(jsonString);
	
	const channel = client.channels.cache.find(channel => channel.name === 'events');
	const msg = await channel.messages.fetch();

	const currentDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	for (const message of msg.values()) {
		// Vérifier que le message a été envoyé par le bot
		if (message.author.id === client.user.id) {
			const event = events[message.id];

			if (new Date(message.createdTimestamp) < currentDate) {
				if(event) {
					if (event.date < currentDate) {
						delete events[message.id];
						fs.writeFileSync('events.json', JSON.stringify(events, null, 2));
						await message.delete();
					}
				} else {
					await message.delete();
				}
			}
		}
	}
}

const job = schedule.scheduleJob('0 1 * * *', removeOldEvents); // 0 1 * * * pour chaque jour à 1h
const check = schedule.scheduleJob('0 * * * *', getReady); // 0 * * * * pour chaque heure

client.login(process.env.token);