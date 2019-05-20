import * as discord from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from "../../../base/module_base/command";
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { CommandProperties } from "../../../base/interface/command_properties";
import { Logger } from "../../../base/debug/logger";
import { EmbedColors } from "../../../base/enum/embed_colors";
import ideas from '../storage/ideas.json'; //index 0 of the array is used to retain type information. At no point in this command should it be edited or removed. tsconfig is set to ignore this file, remove it from exclude if the file has not been compiled yet.
import config from '../config.json';

export class Ideas extends Command{
    
    protected configData: CommandProperties

    private constructor(){
        super();

        this.configData.names = config.ideas.names;
        this.configData.arguments = config.ideas.arguments;
    }

    public processCommand(info: DiscordCommandInfo){
        let action = info.arguments['action'] as string;
        let title = info.arguments['title'] as string;
        let description = info.arguments['description'] as string;

        if (action === 'add'){
            this.add(info, title, description);
        }
        else if (action === 'remove'){
            this.remove(info, title);
        }
        else if (action === 'view'){
            this.view(info);
        }
        else {
            info.channel.send(`Action selected is not valid. Must be add, remove, or view`);
        }
    }

    /**
     * Add a command to the list, if the title and description of the command are present.
     * 
     * @param info 
     * @param title 
     * @param description 
     */
    private async add(info: DiscordCommandInfo, title: string, description: string){
        if (title === undefined || description === undefined){
            info.channel.send('title or description for idea is missing');
            return;
        }

        ideas.ideas_list.push({ "title": title, "description": description });
        this.save();

        info.channel.send(`idea ${title} successfully added`)
    }

    //#region remove
    /**
     * Removes a command from the list, either using the command's title or a followup prompt
     * 
     * @param info 
     * @param title 
     */
    private async remove(info: DiscordCommandInfo, title: string){
        if (info.authorGuildMember === null){
            info.channel.send(`Not in server, must be in server to use remove`);
            return;
        }

        if (info.authorGuildMember.hasPermission('ADMINISTRATOR') === false){
            info.channel.send(`Must have admin priveliges to use command`);
            return;
        }

        if (ideas.ideas_list.length <= 1){
            info.channel.send(`There are no ideas to remove`);
            return;
        }

        if (title === undefined){
            this.removeWithoutTitle(info);
        }
        else{
            let indexOf : number | undefined;

            for (let index = 1; index < ideas.ideas_list.length; index++){
                if (ideas.ideas_list[index].title === title){
                    indexOf = index;
                    break;
                }
            }

            if (indexOf === undefined){
                info.channel.send(`idea ${title} is not present`);
                return;
            }

            ideas.ideas_list.splice(indexOf, 1);
            this.save();
            info.channel.send(`idea removed`);
        }
    }

    /**
     * followup prompt for remove command
     * 
     * @param info 
     */
    private removeWithoutTitle(info: DiscordCommandInfo) {
        this.view(info);
        info.channel.send(`enter the number of the idea to remove or 0 to cancel`);

        const filter = this.createFilter(info);
        const collector = new discord.MessageCollector(info.channel, filter);
        collector.once('collect', (message: discord.Message, messageCollector: discord.MessageCollector) => {
            let index = parseInt(message.content);

            if (index === 0){
                info.channel.send(`Cancelling remove`).then((msg: discord.Message) => {
                    msg.delete(5000);
                });
                return;
            }

            ideas.ideas_list.splice(index, 1);
            this.save();
            info.channel.send(`idea removed`);
        });
    }

    /**
     * filter used to get input after followup prompt
     * 
     * @param info 
     */
    private createFilter(info: DiscordCommandInfo) {
        return (message: discord.Message) => {
            let messageAsNumber = parseInt(message.content);
            if (message.author !== info.author) {
                return false;
            }
            if (isNaN(messageAsNumber)) {
                info.channel.send(`Input must be a number`);
                return false;
            }
            if (messageAsNumber < 0 || messageAsNumber >= ideas.ideas_list.length) {
                info.channel.send(`Input must be within the range of 1 - ${ideas.ideas_list.length - 1} or 0 to cancel`);
                return false;
            }
            return true;
        };
    }
    //#endregion

    /**
     * view the list of ideas. used both for !ideas view and in the followup prompt for remove.
     * 
     * @param info 
     */
    private async view(info: DiscordCommandInfo){
        let embedFields : {name: string, value: string}[] = []
        for (let index = 1; index < ideas.ideas_list.length; index++){
            embedFields.push({ name: `Idea #${index}: ${ideas.ideas_list[index].title}`, value: ideas.ideas_list[index].description });
        }

        let embed = {
            color: EmbedColors.GOLD,
            title: config.ideas.output_info.title,
            description: config.ideas.output_info.description,
            fields: embedFields
        }

        info.channel.send({ embed: embed });
    }

    /**
     * saves the ideas list
     */
    private async save(){
        try{
            fs.writeFileSync(path.join(__dirname, '../storage/ideas.json'), JSON.stringify(ideas));
        }
        catch (error) {
            Logger.logDebug(error);
        }
    }
}