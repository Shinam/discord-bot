const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create a profile with class and level')
        .addStringOption(option =>
            option.setName('class')
                .setDescription('Enter your class')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Enter your level')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const className = interaction.options.getString('class');
        const level = interaction.options.getInteger('level');

        // Load existing data from JSON file
        let data = {};
        try {
            const jsonString = fs.readFileSync('./profiles.json', 'utf8');
            data = JSON.parse(jsonString);
        } catch (err) {
            console.log(err);
        }
        console.log(user)
        // Add new user profile data to JSON object
        data[user.id] = {
            username: user.username,
            classe: className,
            level: level
        }

        // Write updated data to JSON file
        fs.writeFileSync('./profiles.json', JSON.stringify(data));

        // Send confirmation message to user
        await interaction.reply({content:`Profile created! Your class is **${className}** and your level is **${level}**.`, ephemeral: true});
    }
};