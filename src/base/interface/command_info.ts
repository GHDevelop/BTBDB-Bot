import * as discord from 'discord.js'

export interface DiscordCommandInfo {
    arguments: Record<string, ArgumentTypes | ArgumentTypes[]>;
    attachments: discord.Collection<discord.Snowflake, discord.MessageAttachment>;
    author: discord.User;
    channel: discord.TextChannel | discord.DMChannel | discord.GroupDMChannel;
    client: discord.Client;
    content: string;
    createdAt: Date;
    embeds: Array<discord.MessageEmbed>;
    guild: discord.Guild | null; //the chat server
    id: discord.Snowflake;
    authorGuildMember: discord.GuildMember | null; //the author as a guild member
    mentions: discord.MessageMentions;
    message: discord.Message;
    system: boolean;
}

export type ArgumentTypes = number | string | boolean | discord.User | discord.GuildMember | discord.Role | discord.Channel