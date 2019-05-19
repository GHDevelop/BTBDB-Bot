import { Command } from "../../../base/module_base/command";
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { CommandProperties } from "../../../base/interface/command_properties";
import { Logger } from "../../../base/debug/logger";
import * as discord from 'discord.js';
import config from '../config.json';

export class Ping extends Command{
    
    protected configData: CommandProperties

    private constructor(){
        super();

        this.configData.names = config.ping.names;
    }

    public processCommand(info: DiscordCommandInfo) {
        let ping = new Date().getTime() - info.createdAt.valueOf();
        info.channel.send(`**${ping}**ms`);
    }
}