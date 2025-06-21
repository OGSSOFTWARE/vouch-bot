require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder
} = require('discord.js');

const { TOKEN, GUILD_ID, VOUCH_LOG_CHANNEL_ID } = process.env;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Define /vouch command
const vouchCommand = new SlashCommandBuilder()
  .setName('vouch')
  .setDescription('Submit a vouch for this server')
  .addStringOption(option =>
    option.setName('message')
      .setDescription('What are you vouching for?')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('stars')
      .setDescription('Rating (1–5 stars)')
      .setRequired(true)
      .addChoices(
        { name: '⭐', value: '1' },
        { name: '⭐⭐', value: '2' },
        { name: '⭐⭐⭐', value: '3' },
        { name: '⭐⭐⭐⭐', value: '4' },
        { name: '⭐⭐⭐⭐⭐', value: '5' }
      ))
  .addAttachmentOption(option =>
    option.setName('proof')
      .setDescription('Attach proof image (optional)')
      .setRequired(false));

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), {
      body: [vouchCommand.toJSON()],
    });
    console.log('✅ Slash command registered.');
  } catch (err) {
    console.error('❌ Failed to register command:', err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'vouch') return;

  const message = interaction.options.getString('message');
  const starStr = interaction.options.getString('stars');
  const stars = parseInt(starStr);
  const proof = interaction.options.getAttachment('proof');
  const user = interaction.user;

  const emojiStars = '⭐'.repeat(stars);

  const embed = new EmbedBuilder()
    .setTitle('New Vouch Received - Thank You')
    .setColor('#f1c40f')
    .setURL('https://ogsware.com/')
    .setDescription(`**${emojiStars}**`)
    .addFields(
      { name: 'Vouch Message', value: message },
      { name: 'Vouched By', value: `<@${user.id}>`, inline: true },
      { name: 'Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
    )
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setTimestamp()
    .setFooter({
      text: 'OGSWare | © 2025 Copyright. All Rights Reserved.',
      iconURL: 'https://media.discordapp.net/attachments/1376632471260762112/1376632582590173315/IMG_3328.gif'
    });

  if (proof && proof.contentType?.startsWith('image/')) {
    embed.setImage(proof.url);
  }

  try {
    await user.send({
      content: `✅ Thanks for your vouch in **${interaction.guild.name}**!`,
      embeds: [embed]
    });
  } catch {
    console.warn(`❌ Could not DM ${user.tag}`);
  }

  await interaction.reply({
    content: '✅ Your vouch was submitted successfully!',
    ephemeral: true
  });

  const vouchChannel = client.channels.cache.get(VOUCH_LOG_CHANNEL_ID);
  if (vouchChannel && vouchChannel.isTextBased()) {
    await vouchChannel.send({ embeds: [embed] });
  } else {
    console.warn('⚠️ Vouch log channel not found. Check your .env config.');
  }
});

client.login(TOKEN);