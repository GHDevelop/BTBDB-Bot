import * as discord from 'discord.js';
import { ArgumentWithIndex } from '../interface/command_info'

export class DataParsers {
    public static findBooleanInMessage(args: string[]) : ArgumentWithIndex | null {
        for (let index = 0; index < args.length; index++){
            if (args[index] === 'true'){
                return { argument: true, index: index };
            }
            else if (args[index] === 'false'){
                return { argument: false, index: index };
            }
        }

        return null;
    }

    public static findChannelInMessage(args: string[], bot: discord.Client) : ArgumentWithIndex | null {
        for (let index = 0; index < args.length; index++){
            const matches = args[index].match(/^<#(\d+)>$/);

            if (matches !== null){
                const id = matches[1];
                const channel = bot.channels.get(id);

                if (channel !== undefined){
                    return { argument: channel, index: index };
                }
            }
        }

        return null;
    }

    public static findMentionInMessage(args: string[], bot: discord.Client, msg: discord.Message) : ArgumentWithIndex | null {
        for (let index = 0; index < args.length; index++){
            const matches = args[index].match(/^<@!?(\d+)>$/);

            if (matches !== null){
                const id = matches[1];
                const user = bot.users.get(id);

                if (user !== undefined){
                    if (!(msg.channel instanceof discord.TextChannel)){
                        return { argument: user, index: index };
                    }
                    const member = msg.guild.member(user);
                    return { argument: member, index: index };
                }
            }
        }

        return null;
    }

    public static findNumberInMessage(args: string[]) : ArgumentWithIndex | null {
        for (let index = 0; index < args.length; index++){
            if (!isNaN(parseFloat(args[index]))){
                return { argument: parseFloat(args[index]), index: index };
            }
        }

        return null;
    }

    public static findPhraseInMessage(args: string[]) : ArgumentWithIndex | null {
        let phraseStatement : { phrase: string, indexes: number[] } | null = null;

        for (let index = 0; index < args.length; index++){
            if (phraseStatement === null){
                phraseStatement = { phrase: '', indexes: []};
            }

            phraseStatement.phrase += args[index];
            phraseStatement.indexes.push(index);

            if (args[index].endsWith('.')){
                phraseStatement.phrase = phraseStatement.phrase.slice(0, -1);
                index = args.length;
            }

            if (index < args.length - 1){
                phraseStatement.phrase += ' ';
            }
        }

        if (phraseStatement !== null)
        {
            return { argument: phraseStatement.phrase, index: phraseStatement.indexes };
        }
        else {
            return null;
        }
    }

    public static findRoleInMessage(args: string[], msg: discord.Message) : ArgumentWithIndex | null {
        for (let index = 0; index < args.length; index++){
            const matches = args[index].match(/^<@&(\d+)>$/);

            if (matches !== null){
                const id = matches[1];
                const role = msg.guild.roles.get(id);

                if (role !== undefined){
                    return { argument: role, index: index };
                }
            }
        }
        
        return null;
    }

    public static findStringInMessage(args: string[]) : ArgumentWithIndex | null {
        if (args.length > 0){
            return { argument: args[0], index: 0 };
        }

        return null;
    }
}