import * as discord from 'discord.js'

export interface DiscordCommandInfo {
    attachments: discord.Collection<discord.Snowflake, discord.MessageAttachment>;
    author: discord.User;
    channel: discord.TextChannel | discord.DMChannel | discord.GroupDMChannel;
    content: string;
    createdAt: Date;
    embeds: Array<discord.MessageEmbed>;
    guild: discord.Guild | null; //the server
    id: discord.Snowflake;
    authorGuildMember: discord.GuildMember | null; //the author as a guild member
    mentions: discord.MessageMentions;
    message: discord.Message | discord.Message[];
    system: boolean;
}