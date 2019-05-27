import * as discord from 'discord.js';
import { Command } from "../../../base/module_base/command";
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { CommandProperties } from "../../../base/interface/command_properties";
import { Logger } from "../../../base/debug/logger";
import config from '../config.json';

import { EmbedColors } from '../../../base/enum/embed_colors';
import { ArgTypesEnum } from '../../../base/enum/arg_type';
import globalConfig from '../../../../config.json'

export class Help extends Command{
    
    protected configData: CommandProperties

    private constructor(){
        super();

        this.configData.names = config.help.names;
        this.configData.description = config.help.description;
    }

    public processCommand(info: DiscordCommandInfo) {
        let commandData = this.getCommandDataForHelp();
        let embed = new discord.RichEmbed();

        embed.setColor(EmbedColors.DEFAULT);
        embed.setTitle(`Commands`);
        embed.setDescription(`**Argument Types:**\n`
                           + `**${ArgTypesEnum.Number}:** a number, '3' will work, but 'three' will not\n`
                           + `**${ArgTypesEnum.String}:** any single word\n`
                           + `**${ArgTypesEnum.Boolean}:** true or false\n`
                           + `**${ArgTypesEnum.Phrase}:** a set of words ending with a period followed by a space (. )\n`
                           + `**${ArgTypesEnum.Mention}:** a mention of another user in the text channel (@Someone)\n`
                           + `**${ArgTypesEnum.Role}:** a mention of a role on the server, @everyone and @here do not count (@role)\n`
                           + `**${ArgTypesEnum.Channel}:** a mention of a channel on the chat server (#channel)`);

        commandData.indexes.forEach(module => {
            embed.addBlankField();
            embed.addField(module, `--------------------------------------------------------------------------------------`);

            commandData.data[module].forEach(command => {
                let fieldTitle = `${globalConfig.Command.signal}${command.names[0]}`;
                command.arguments.forEach(argument => {
                    fieldTitle += ` <${argument.name}`;
                    fieldTitle += argument.required === true ? `>` : ` (optional)>`;
                });

                let fieldDescription = `${command.description}\nAlternate names include `;
                for (let index = 1; index < command.names.length; index++){
                    if (index !== command.names.length - 1){
                        fieldDescription += `${command.names[index]}, `;
                    }
                    else if (index === 1){
                        fieldDescription += `${command.names[index]}`;
                    }
                    else {
                        fieldDescription += `and ${command.names[index]}`;
                    }
                }

                command.arguments.forEach(argument => {
                    fieldDescription += `\n**${argument.name} (${argument.type}):**`;
                    fieldDescription += argument.description === undefined ? '' : ` ${argument.description}`;
                    fieldDescription += argument.required === true ? '' : ' (optional)';
                    fieldDescription += (argument.required === true || argument.default === undefined) ? '' : ` (default is ${argument.default})`;
                    fieldDescription += argument.isUnlimited !== true ? '' : ` (plural argument)`;
                })

                embed.addField(fieldTitle, fieldDescription);
            });
        });

        info.author.send(embed)
    }
}