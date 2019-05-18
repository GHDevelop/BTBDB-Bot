import * as discord from 'discord.js'
import { Logger } from '../debug/logger'
import { BaseManager } from './base_manager';
import { Command } from '../module_base/command'
import { DiscordCommandInfo } from '../interface/command_info'

import config from '../../../config.json';

export class CommandManager extends BaseManager<Command>{

    protected checkIfInstanceOf(objectOfType : any){
        return objectOfType instanceof Command;
    }

    public loadCommands(bot: discord.Client){
        this.getCommandList(config.ModulePaths.modulePath, config.ModulePaths.commandPath);
        this.runFiles(bot);
    }

    protected runFiles(bot: discord.Client){
        let commandsWithAlias = this.GetCommandNames();

        bot.on('message', msg => {
            if (msg.content.substring(0, 1) === config.Command.signal){
                let args = msg.content.substring(1).split(' ');

                commandsWithAlias.forEach(alias => {
                    if (args[0] === alias.name){
                        let commandInfo : DiscordCommandInfo = {
                            attachments: msg.attachments,
                            author: msg.author,
                            channel: msg.channel,
                            content: msg.content,
                            createdAt: msg.createdAt,
                            embeds: msg.embeds,
                            guild: msg.guild,
                            id: msg.id,
                            authorGuildMember: msg.member,
                            mentions: msg.mentions,
                            message: msg,
                            system: msg.system
                        }
                        alias.command.processCommand(commandInfo)
                    }
                })
            }
        });
    }

    private GetCommandNames() : {name: string, command: Command}[] {
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
}