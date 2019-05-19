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
        //string in info.channel.send is meaningless here. As long as it isn't empty it will make no difference
        info.channel.send(config.ping.pingMessage).then(msg => {
            let botMsg = msg as discord.Message;
            let ping = botMsg.createdAt.valueOf() - info.createdAt.valueOf();
            botMsg.edit(`${config.ping.pingMessage} **${ping}**ms`);
        })
    }
}