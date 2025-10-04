const { Client, GatewayIntentBits, Events, EmbedBuilder, PermissionFlagsBits, AuditLogEvent } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ]
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot is online! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  if (!member.user.bot) return;
  
  try {
    const guild = member.guild;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.BotAdd,
      limit: 5,
    });
    
    const botAddLog = auditLogs.entries.find(entry => entry.target?.id === member.id);
    
    if (!botAddLog) {
      console.log(`⚠️ Could not find audit log for bot ${member.user.tag}`);
      return;
    }
    
    const executor = botAddLog.executor;
    
    if (!executor) {
      console.log(`⚠️ Could not identify who added bot ${member.user.tag}`);
      return;
    }
    
    if (executor.id === guild.ownerId) {
      console.log(`✅ Bot ${member.user.tag} was added by server owner, allowing it.`);
      return;
    }
    
    if (!member.kickable) {
      console.log(`⚠️ Cannot kick bot ${member.user.tag} - insufficient permissions`);
      return;
    }
    
    await member.kick('Bot added by non-owner - Auto-kick enabled');
    console.log(`🚫 Auto-kicked bot ${member.user.tag} added by ${executor.tag}`);
    
    const systemChannel = guild.systemChannel || guild.channels.cache.find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages));
    
    if (systemChannel) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚫 Bot Auto-Kicked')
        .setDescription(`A bot was automatically removed because it was added by a non-owner.`)
        .addFields(
          { name: '🤖 Bot', value: member.user.tag, inline: true },
          { name: '👤 Added by', value: executor.tag, inline: true },
          { name: '📋 Reason', value: 'Only the server owner can add bots', inline: false }
        )
        .setTimestamp();
      
      systemChannel.send({ embeds: [embed] }).catch(() => {});
    }
  } catch (error) {
    console.error(`❌ Error in auto-kick system:`, error.message);
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  const prefix = '!';
  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'kick') {
      if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return message.reply('❌ You need **Kick Members** permission to use this command.');
      }
      
      const member = message.mentions.members.first();
      if (!member) {
        return message.reply('❌ Please mention a user to kick. Usage: `!kick @user [reason]`');
      }
      
      if (!member.kickable) {
        return message.reply('❌ I cannot kick this user. They may have higher permissions than me.');
      }
      
      const reason = args.slice(1).join(' ') || 'No reason provided';
      
      try {
        await member.kick(reason);
        const embed = new EmbedBuilder()
          .setColor('#FF6B6B')
          .setTitle('👢 Member Kicked')
          .setDescription(`**${member.user.tag}** has been kicked from the server.`)
          .addFields(
            { name: '👤 User', value: member.user.tag, inline: true },
            { name: '🔨 Moderator', value: message.author.tag, inline: true },
            { name: '📝 Reason', value: reason, inline: false }
          )
          .setTimestamp();
        
        message.reply({ embeds: [embed] });
        console.log(`🔨 ${message.author.tag} kicked ${member.user.tag}`);
      } catch (error) {
        message.reply(`❌ Failed to kick user: ${error.message}`);
        console.error('Kick error:', error);
      }
      return;
    }

    if (command === 'ban') {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply('❌ You need **Ban Members** permission to use this command.');
      }
      
      const member = message.mentions.members.first();
      if (!member) {
        return message.reply('❌ Please mention a user to ban. Usage: `!ban @user [reason]`');
      }
      
      if (!member.bannable) {
        return message.reply('❌ I cannot ban this user. They may have higher permissions than me.');
      }
      
      const reason = args.slice(1).join(' ') || 'No reason provided';
      
      try {
        await member.ban({ reason });
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🔨 Member Banned')
          .setDescription(`**${member.user.tag}** has been banned from the server.`)
          .addFields(
            { name: '👤 User', value: member.user.tag, inline: true },
            { name: '🔨 Moderator', value: message.author.tag, inline: true },
            { name: '📝 Reason', value: reason, inline: false }
          )
          .setTimestamp();
        
        message.reply({ embeds: [embed] });
        console.log(`🔨 ${message.author.tag} banned ${member.user.tag}`);
      } catch (error) {
        message.reply(`❌ Failed to ban user: ${error.message}`);
        console.error('Ban error:', error);
      }
      return;
    }

    if (command === 'unban') {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply('❌ You need **Ban Members** permission to use this command.');
      }
      
      const userId = args[0];
      if (!userId) {
        return message.reply('❌ Please provide a user ID to unban. Usage: `!unban <user_id>`');
      }
      
      try {
        await message.guild.members.unban(userId);
        const embed = new EmbedBuilder()
          .setColor('#4CAF50')
          .setTitle('✅ Member Unbanned')
          .setDescription(`User with ID **${userId}** has been unbanned.`)
          .addFields(
            { name: '🔨 Moderator', value: message.author.tag, inline: true }
          )
          .setTimestamp();
        
        message.reply({ embeds: [embed] });
        console.log(`✅ ${message.author.tag} unbanned user ID ${userId}`);
      } catch (error) {
        message.reply(`❌ Failed to unban user: ${error.message}`);
        console.error('Unban error:', error);
      }
      return;
    }

    if (command === 'timeout' || command === 'mute') {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply('❌ You need **Timeout Members** permission to use this command.');
      }
      
      const member = message.mentions.members.first();
      if (!member) {
        return message.reply('❌ Please mention a user to timeout. Usage: `!timeout @user <minutes> [reason]`');
      }
      
      if (!member.moderatable) {
        return message.reply('❌ I cannot timeout this user. They may have higher permissions than me.');
      }
      
      const minutes = parseInt(args[1]);
      if (!minutes || minutes < 1 || minutes > 40320) {
        return message.reply('❌ Please provide a valid duration in minutes (1-40320). Usage: `!timeout @user <minutes> [reason]`');
      }
      
      const reason = args.slice(2).join(' ') || 'No reason provided';
      
      try {
        await member.timeout(minutes * 60 * 1000, reason);
        const embed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('⏰ Member Timed Out')
          .setDescription(`**${member.user.tag}** has been timed out.`)
          .addFields(
            { name: '👤 User', value: member.user.tag, inline: true },
            { name: '🔨 Moderator', value: message.author.tag, inline: true },
            { name: '⏱️ Duration', value: `${minutes} minutes`, inline: true },
            { name: '📝 Reason', value: reason, inline: false }
          )
          .setTimestamp();
        
        message.reply({ embeds: [embed] });
        console.log(`⏰ ${message.author.tag} timed out ${member.user.tag} for ${minutes} minutes`);
      } catch (error) {
        message.reply(`❌ Failed to timeout user: ${error.message}`);
        console.error('Timeout error:', error);
      }
      return;
    }

    if (command === 'clear' || command === 'purge') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply('❌ You need **Manage Messages** permission to use this command.');
      }
      
      const amount = parseInt(args[0]);
      if (!amount || amount < 1 || amount > 100) {
        return message.reply('❌ Please provide a number between 1 and 100. Usage: `!clear <amount>`');
      }
      
      try {
        const deletedMessages = await message.channel.bulkDelete(amount + 1, true);
        const reply = await message.channel.send(`✅ Successfully deleted ${deletedMessages.size - 1} messages.`);
        
        setTimeout(() => reply.delete().catch(() => {}), 5000);
        console.log(`🗑️ ${message.author.tag} cleared ${deletedMessages.size - 1} messages in #${message.channel.name}`);
      } catch (error) {
        message.reply(`❌ Failed to delete messages: ${error.message}`);
        console.error('Clear error:', error);
      }
      return;
    }

    if (command === 'help') {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📋 Moderation Commands')
        .setDescription('Here are the available moderation commands:')
        .addFields(
          { name: '👢 !kick', value: '`!kick @user [reason]` - Kick a member from the server', inline: false },
          { name: '🔨 !ban', value: '`!ban @user [reason]` - Ban a member from the server', inline: false },
          { name: '✅ !unban', value: '`!unban <user_id>` - Unban a member using their user ID', inline: false },
          { name: '⏰ !timeout', value: '`!timeout @user <minutes> [reason]` - Timeout a member (1-40320 min)', inline: false },
          { name: '🗑️ !clear', value: '`!clear <amount>` - Delete multiple messages (1-100)', inline: false },
          { name: '❓ !help', value: 'Show this help message', inline: false }
        )
        .setFooter({ text: 'Use commands responsibly!' })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }
  }
  
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach(async (user) => {
      if (user.bot) return;
      
      try {
        const indiaTime = new Date(message.createdTimestamp).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'full',
          timeStyle: 'short'
        });
        
        const messageContent = message.content.trim() || '*(no text content - may contain attachments or embeds)*';
        const displayContent = messageContent.length > 1024 ? messageContent.substring(0, 1021) + '...' : messageContent;
        
        const embed = new EmbedBuilder()
          .setColor('#FF69B4')
          .setTitle('✨ Hey! Someone tagged you')
          .setDescription(`**${message.author.username}** just mentioned you in **${message.guild.name}**\n\n💭 *Thought you'd want to know!*`)
          .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
          .setImage('https://media.giphy.com/media/Nx0rz3jtxtEre/giphy.gif')
          .addFields(
            { name: '🌟 Tagged by', value: `**${message.author.username}**`, inline: true },
            { name: '🎯 That\'s you!', value: `**${user.username}**`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: '💬 In channel', value: `#${message.channel.name}`, inline: true },
            { name: '🕐 When (IST)', value: indiaTime, inline: false },
            { name: '💌 What they said', value: displayContent, inline: false },
            { name: '🚀 Quick Jump', value: `[Click here to see the message →](${message.url})`, inline: false }
          )
          .setFooter({ text: `💫 ${message.guild.name} • ${message.id}`, iconURL: message.guild.iconURL() || undefined })
          .setTimestamp(message.createdTimestamp);
        
        if (message.author.displayAvatarURL()) {
          embed.setAuthor({ 
            name: message.author.username, 
            iconURL: message.author.displayAvatarURL({ dynamic: true })
          });
        }
        
        await user.send({ embeds: [embed] });
        console.log(`✉️ Sent aesthetic DM to ${user.tag} about mention from ${message.author.tag}`);
      } catch (error) {
        console.error(`❌ Could not send DM to ${user.tag}:`, error.message);
      }
    });
  }
});

client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ ERROR: DISCORD_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

client.login(token).catch((error) => {
  console.error('❌ Failed to login:', error.message);
  process.exit(1);
});
