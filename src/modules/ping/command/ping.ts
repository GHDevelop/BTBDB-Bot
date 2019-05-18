import { Command } from "../../../base/module_base/command";
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { Logger } from "../../../base/debug/logger";

import config from '../config.json';
import * as fs from "fs";

export class Ping extends Command{
    
    protected configData: { 
        names: string[]; 
        arguments: string[];
    }

    private constructor(){
        super();

        this.configData.names = config.ping.names;
    }

    public processCommand(info: DiscordCommandInfo) {
        let ping = Date.now() - info.createdAt.valueOf();
        info.channel.send(ping);
    }
}