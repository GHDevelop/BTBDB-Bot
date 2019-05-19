import * as discord from 'discord.js'
import { Logger } from '../debug/logger'
import { BaseManager } from './base_manager';
import { Command } from '../module_base/command'
import { DiscordCommandInfo, ArgumentTypes } from '../interface/command_info'

import config from '../../../config.json';
import { ArgTypesEnum } from '../enum/arg_type';
import { isArray } from 'util';


export interface CommandArgumentInfo { 
    argument: ArgumentTypes, 
    index: number | number[]
}

export class CommandManager extends BaseManager<Command>{

    protected checkIfInstanceOf(objectOfType : any){
        return objectOfType instanceof Command;
    }

    public loadCommands(bot: discord.Client){
        this.getCommandList(config.ModulePaths.modulePath, config.ModulePaths.commandPath);
        this.runFiles(bot);
    }

    protected runFiles(bot: discord.Client){
        let commandsWithAlias = this.getCommandNames();

        bot.on('message', msg => {
            if (msg.content.substring(0, 1) === config.Command.signal){
                let args = msg.content.substring(1).split(' ');

                commandsWithAlias.forEach(alias => {
                    if (args[0] === alias.name){
                        {
                            args.splice(0, 1);
                            //string is error
                            try {
                                let argumentsFromMessage = this.getArgumentsFromMessage(alias, args, bot, msg);
                                Logger.logDebug('Hello');
    
                                let commandInfo : DiscordCommandInfo = {
                                    arguments: argumentsFromMessage,
                                    attachments: msg.attachments,
                                    author: msg.author,
                                    channel: msg.channel,
                                    client: bot,
                                    content: msg.content,
                                    createdAt: msg.createdAt,
                                    embeds: msg.embeds,
                                    guild: msg.guild,
                                    id: msg.id,
                                    authorGuildMember: msg.member,
                                    mentions: msg.mentions,
                                    message: msg,
                                    system: msg.system
                                };
        
                                alias.command.processCommand(commandInfo);
                            }
                            catch (err){
                                msg.channel.send(err);
                            }
                        }
                    }
                })
            }
        });
    }

    private getCommandNames() : {name: string, command: Command}[] {
        let commandsWithAlias: {
            name: string;
            command: Command;
        }[] = [];

        this.classList.forEach(command => {
            command.getData().names.forEach(name => {
                commandsWithAlias.push({ name: name, command: command });
            });
        });

        return commandsWithAlias;
    }

    //#region arguments
    /**
     * Converts the args array from the message into a record of usable arguments.
     * 
     * @param alias 
     * @param args 
     * @param bot 
     * @param msg 
     */
    private getArgumentsFromMessage(alias: { name: string; command: Command; }, args: string[], bot: discord.Client, msg: discord.Message) : Record<string, ArgumentTypes | ArgumentTypes[]> {
        let argsList : Record<string, ArgumentTypes | ArgumentTypes[]> = {};

        let commandArgs = alias.command.getData().arguments;

        commandArgs.forEach(currentArgument => {
            Logger.logDebug(args.length.toString());
            if (currentArgument.isUnlimited !== true)
            {
                args = this.handleLimitedArguments(currentArgument, args, bot, msg, argsList);
            }
            else if (currentArgument.isUnlimited === true){
                args = this.handleUnlimitedArguments(currentArgument, args, bot, msg, argsList);
            }
        });

        return argsList;
    }

    /**
     * converts a single argument to the proper format
     * 
     * @param currentArgument 
     * @param args 
     * @param bot 
     * @param msg 
     * @param argsList 
     */
    private handleLimitedArguments(currentArgument: { name: string; type: string; required?: boolean | undefined; default?: any; isUnlimited?: boolean | undefined; }, args: string[], bot: discord.Client, msg: discord.Message, argsList: Record<string, string | number | boolean | discord.User | discord.Role | discord.Channel | ArgumentTypes[]>) {
        let convertedArgumentInfo: CommandArgumentInfo | null;
        convertedArgumentInfo = this.convertArgumentInfo(currentArgument.type, args, bot, msg);
        let processedArg = this.processArgumentInfo(convertedArgumentInfo, currentArgument.name, args, currentArgument.required, currentArgument.default);
        //error
        if (typeof processedArg === 'string') {
            throw processedArg;
        }
        if (processedArg !== undefined) {
            argsList[currentArgument.name] = processedArg.argument;
            args = processedArg.newArgs;
        }
        return args;
    }

    /**
     * Converts as many valid arguments as possible to the proper format
     * 
     * @param currentArgument 
     * @param args 
     * @param bot 
     * @param msg 
     * @param argsList 
     */
    private handleUnlimitedArguments(currentArgument: { name: string; type: string; required?: boolean | undefined; default?: any; isUnlimited?: boolean | undefined; }, args: string[], bot: discord.Client, msg: discord.Message, argsList: Record<string, string | number | boolean | discord.User | discord.Role | discord.Channel | ArgumentTypes[]>) {
        let argArray: ArgumentTypes[] = [];
        while (true) {
            let convertedArgumentInfo: CommandArgumentInfo | null;
            convertedArgumentInfo = this.convertArgumentInfo(currentArgument.type, args, bot, msg);
            let isUnlimited = argArray.length > 0 ? true : false;
            let processedArg = this.processArgumentInfo(convertedArgumentInfo, currentArgument.name, args, currentArgument.required, currentArgument.default, isUnlimited);
            //error
            if (typeof processedArg === 'string') {
                if (argArray.length === 0) {
                    throw processedArg;
                }
                else {
                    //exit loop
                    break;
                }
            }
            if (typeof processedArg === 'undefined') {
                //exit loop
                break;
            }
            argArray.push(processedArg.argument);
            args = processedArg.newArgs;
        }
        argsList[currentArgument.name] = argArray;
        return args;
    }

    /**
     * Converts arguments from string to the corresponding type
     * 
     * @param type 
     * @param args 
     * @param bot 
     * @param msg 
     */
    private convertArgumentInfo(type: string, args: string[], bot: discord.Client, msg: discord.Message){
        switch (type){
            case ArgTypesEnum.Number:
                return this.findNumberInMessage(args);
            case ArgTypesEnum.String:
                return this.findStringInMessage(args);
            case ArgTypesEnum.Boolean:
                return this.findBooleanInMessage(args);
            case ArgTypesEnum.Phrase:
                return this.findPhraseInMessage(args);
            case ArgTypesEnum.Mention:
                return this.findMentionInMessage(args, bot);
            case ArgTypesEnum.Role:
                return this.findRoleInMessage(args, msg);
            case ArgTypesEnum.Channel:
                return this.findChannelInMessage(args, bot);
            default:
                return null;
        };
    }

    /**
     * If the argument is null, then it will return an error string if required,
     * be defaulted if it's the first instance of a defaultable argument,
     * or return undefined if neither
     * 
     * it will also remove the arguments used from args
     * 
     * @param convertedArgumentInfo 
     * @param argName 
     * @param args 
     * @param required 
     * @param defaultValue 
     * @param isUnlimited 
     */
    private processArgumentInfo(convertedArgumentInfo: CommandArgumentInfo | null, argName: string, args: string[], required?: boolean, defaultValue?: any, isUnlimited?: boolean) :  { argument: ArgumentTypes, newArgs: string[] } | string | undefined {
        if (convertedArgumentInfo === null){
            if (required === true){
                return `Argument ${argName} is missing. This argument is required in order to use this command.`;
            }
            if (defaultValue && isUnlimited === false){
                return { argument: defaultValue, newArgs: args };
            }

            return undefined;
        }
        else {
            this.removeConvertedArgumentFromArgs(convertedArgumentInfo, args);

            return { argument: convertedArgumentInfo.argument, newArgs: args };
        }
    }

    /**
     * Removes arguments that have already been converted from args
     * 
     * @param convertedArgumentInfo 
     * @param args 
     */
    private removeConvertedArgumentFromArgs(convertedArgumentInfo: CommandArgumentInfo, args: string[]) {
        if (!isArray(convertedArgumentInfo.index)) {
            args.splice(convertedArgumentInfo.index, 1);
        }
        else {
            let indexes: number[] = [];
            convertedArgumentInfo.index.forEach(index => {
                indexes.push(index);
            });
            for (let index = indexes.length - 1; index >= 0; index--) {
                args.splice(indexes[index], 1);
            }
        }
    }

    //#region cast_argument
    private findBooleanInMessage(args: string[]) : CommandArgumentInfo | null {
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

    private findChannelInMessage(args: string[], bot: discord.Client) : CommandArgumentInfo | null {
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

    private findMentionInMessage(args: string[], bot: discord.Client) : CommandArgumentInfo | null {
        for (let index = 0; index < args.length; index++){
            const matches = args[index].match(/^<@!?(\d+)>$/);

            if (matches !== null){
                const id = matches[1];
                const user = bot.users.get(id);

                if (user !== undefined){
                    return { argument: user, index: index };
                }
            }
        }

        return null;
    }

    private findNumberInMessage(args: string[]) : CommandArgumentInfo | null {
        for (let index = 0; index < args.length; index++){
            if (!isNaN(parseFloat(args[index]))){
                return { argument: parseFloat(args[index]), index: index };
            }
        }

        return null;
    }

    private findPhraseInMessage(args: string[]) : CommandArgumentInfo | null {
        let phraseStatement : { phrase: string, indexes: number[] } | null = null;

        for (let index = 0; index < args.length; index++){
            if (phraseStatement === null){
                phraseStatement = { phrase: '', indexes: []};
            }

            phraseStatement.phrase += args[index];
            phraseStatement.indexes.push(index);

            if (args[index].endsWith('.')){
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

    private findRoleInMessage(args: string[], msg: discord.Message) : CommandArgumentInfo | null {
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

    private findStringInMessage(args: string[]) : CommandArgumentInfo | null {
        if (args.length > 0){
            return { argument: args[0], index: 0 };
        }

        return null;
    }
    //#endregion
    //#endregion
}