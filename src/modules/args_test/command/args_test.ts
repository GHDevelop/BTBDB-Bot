import { Command } from "../../../base/module_base/command";
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { CommandProperties } from "../../../base/interface/command_properties";
import { Logger } from "../../../base/debug/logger";
import config from '../config.json';
import userconfig from '../userconfig.json';

export class ArgsTest extends Command{
    
    protected configData: CommandProperties

    private constructor(){
        super();

        this.configData.names = userconfig.args_test.names;
        this.configData.description = userconfig.args_test.description;
        this.configData.arguments = config.args_test.arguments;
    }

    public processCommand(info: DiscordCommandInfo) {
        let num : any[] = [];

        for (let index = 0; index < config.args_test.arguments.length; index++){
            num.push(info.arguments[config.args_test.arguments[index].name]);
        }

        num.forEach(arg => {
            Logger.logInfo(arg);
        })
    }
}