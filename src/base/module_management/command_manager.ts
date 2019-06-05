import * as discord from 'discord.js'
import { Logger } from '../debug/logger'
import { BaseManager } from './base_manager';
import { Command } from '../module_base/command'
import { DiscordCommandInfo, ArgumentTypes, ArgumentWithIndex } from '../interface/command_info'
import { CommandProperties } from '../interface/command_properties';

import config from '../../../config.json';
import userconfig from '../../../userconfig.json';
import { ArgTypesEnum } from '../enum/arg_type';
import { DataParsers } from '../libs/data_parsers';

export class CommandManager extends BaseManager{
    protected static moduleList : string[] = []; //Used to allow forEach loops through commandList
    protected static commandList : Record<string, Command[]> = {};

    /**
     * Workaround used since generic types cannot be used with instanceof checks
     * 
     * @param objectOfType 
     */
    protected static checkIfInstanceOf(objectOfType : any){
        return objectOfType instanceof Command;
    }

    public static loadCommands(bot: discord.Client){
        if (this.moduleList.length === 0){
            let commandsWithModuleName = this.getClassList<Command>(config.ModulePaths.modulePath, config.ModulePaths.commandPath, Command.name, this.checkIfInstanceOf);
            this.moduleList = commandsWithModuleName.moduleList;
            this.commandList = commandsWithModuleName.classList;

            this.runCommands(bot);
        }
        else {
            Logger.logError(`Commands have already been loaded`);
        }
    }

    protected static async runCommands(bot: discord.Client){
        let commandsWithAlias = this.getCommandWithNames();

        bot.on('message', msg => {
            if (msg.content.substring(0, 1) === userconfig.Command.signal){
                let args = msg.content.substring(1).split(' ');

                commandsWithAlias.forEach(alias => {
                    if (args[0] !== undefined && args[0].toLowerCase() === alias.name){
                        {
                            args.splice(0, 1);

                            try {
                                let argumentsFromMessage = this.getArgumentsFromMessage(alias, args, bot, msg);
    
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

    /**
     * Provides a list of command data organized by the containing module. This includes information such as the command's name, description, and arguments. Used primarily for "help" commands
     */
    public static getCommandData() : { indexes: string[], data: Record<string, CommandProperties[]> } {
        let commandData : Record<string, CommandProperties[]> = {};

        this.moduleList.forEach(module => {
            commandData[module] = [];

            this.commandList[module].forEach(command => {
                commandData[module].push(command.getData());
            });
        });

        return { indexes: this.moduleList, data: commandData };
    }

    //#region get_commands_internal
    /**
     * Gets each command along with the names used to call the command (for example, the ping command could be called with !ping or !delay)
     */
    private static getCommandWithNames() : { name: string, command: Command }[] {
        let commandsWithAlias: {
            name: string;
            command: Command;
        }[] = [];

        this.moduleList.forEach(module => {
            this.getCommandsInModule(module, commandsWithAlias);
        })

        return commandsWithAlias;
    }

    /**
     * Gets all the commands in a module with their name
     * 
     * @param module 
     * @param commandsWithAlias 
     */
    private static getCommandsInModule(module: string, commandsWithAlias: { name: string; command: Command; }[]) {
        this.commandList[module].forEach(command => {
            command.getData().names.forEach(name => {
                commandsWithAlias.push({ name: name, command: command });
            });
        });
    }
    //#endregion

    //#region arguments
    /**
     * Converts the args array from the message into a record of usable arguments.
     * 
     * @param alias 
     * @param args 
     * @param bot 
     * @param msg 
     */
    private static getArgumentsFromMessage(alias: { name: string; command: Command; }, args: string[], bot: discord.Client, msg: discord.Message) : Record<string, ArgumentTypes | ArgumentTypes[]> {
        let argsList : Record<string, ArgumentTypes | ArgumentTypes[]> = {};

        let commandArgs = alias.command.getData().arguments;

        commandArgs.forEach(currentArgument => {
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
    private static handleLimitedArguments(currentArgument: { name: string; type: string; required?: boolean | undefined; default?: any; isUnlimited?: boolean | undefined; }, args: string[], bot: discord.Client, msg: discord.Message, argsList: Record<string, ArgumentTypes | ArgumentTypes[]>) {
        let convertedArgumentInfo: ArgumentWithIndex | null;
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
    private static handleUnlimitedArguments(currentArgument: { name: string; type: string; required?: boolean | undefined; default?: any; isUnlimited?: boolean | undefined; }, args: string[], bot: discord.Client, msg: discord.Message, argsList: Record<string, ArgumentTypes | ArgumentTypes[]>) {
        let argArray: ArgumentTypes[] = [];
        while (true) {
            let convertedArgumentInfo: ArgumentWithIndex | null;
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
    private static convertArgumentInfo(type: string, args: string[], bot: discord.Client, msg: discord.Message){
        switch (type){
            case ArgTypesEnum.Number:
                return DataParsers.findNumberInMessage(args);
            case ArgTypesEnum.String:
                return DataParsers.findStringInMessage(args);
            case ArgTypesEnum.Boolean:
                return DataParsers.findBooleanInMessage(args);
            case ArgTypesEnum.Phrase:
                return DataParsers.findPhraseInMessage(args);
            case ArgTypesEnum.Mention:
                return DataParsers.findMentionInMessage(args, bot, msg);
            case ArgTypesEnum.Role:
                return DataParsers.findRoleInMessage(args, msg);
            case ArgTypesEnum.Channel:
                return DataParsers.findChannelInMessage(args, bot);
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
    private static processArgumentInfo(convertedArgumentInfo: ArgumentWithIndex | null, argName: string, args: string[], required?: boolean, defaultValue?: any, isUnlimited?: boolean) :  { argument: ArgumentTypes, newArgs: string[] } | string | undefined {
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
    private static removeConvertedArgumentFromArgs(convertedArgumentInfo: ArgumentWithIndex, args: string[]) {
        if (!Array.isArray(convertedArgumentInfo.index)) {
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
    //#endregion
}