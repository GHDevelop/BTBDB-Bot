import * as discord from 'discord.js';
import { Command } from "../../../base/module_base/command";
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { CommandProperties } from "../../../base/interface/command_properties";
import { Logger } from "../../../base/debug/logger";
import config from '../config.json';
import userconfig from '../userconfig.json';

import * as lodash from 'lodash';

export class Spam extends Command{
    
    protected configData: CommandProperties

    private constructor(){
        super();

        this.configData.names = userconfig.spam.names;
        this.configData.description = userconfig.spam.description;
        this.configData.arguments = config.spam.arguments;
    }

    public processCommand(info: DiscordCommandInfo) {
        let victim = info.arguments['victim'] as discord.GuildMember;
        let number = info.arguments['number'] as number;
        let frequency = info.arguments['frequency'] as number;
        let messages = info.arguments['messages'] as string[];
        
        if (victim.user === undefined){
            info.channel.send(`Cannot use spam in DMs`);
            return;
        }

        if (victim.user.bot){
            info.channel.send(`Cannot spam bots`);
            return;
        }

        if (info.message.deletable){
            info.message.delete();
        }

        messages.forEach(message => {
            Logger.logInfo(message);
        })

        this.spamTime(victim.user, number, frequency, messages);
    }

    private async spamTime(victim: discord.User, number: number, frequency: number, messages: string[]){

        const sendMessageAfterDelay = (timer : number, message: string) => new Promise(resolve => setTimeout(() => {
            victim.send(message);
            resolve(); 
        }, timer));

        for (let index = 0; index < number; index++){
            const message = this.selectMessage(messages);
            await sendMessageAfterDelay(frequency * config.spam.time_measurements.seconds, message);
        }
    }

    private selectMessage(messages: string[]) : string {
        return messages[lodash.random(messages.length - 1, false)];
    }
}