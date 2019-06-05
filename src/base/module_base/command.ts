import {DiscordCommandInfo} from '../interface/command_info';
import {CommandProperties} from '../interface/command_properties';
import {Logger} from '../debug/logger';
import { CommandManager } from '../module_management/command_manager';

export abstract class Command{

    protected abstract configData : CommandProperties;

    protected constructor(){
        //Does nothing. Prevents error when running config in children, which requires super()
        this.setConfigData();
    }

    protected getCommandDataForHelp(){
        return CommandManager.getCommandData();
    }

    public getData(): CommandProperties{
        return this.configData;
    }

    public abstract processCommand(info: DiscordCommandInfo) : void;

    private setConfigData() {
        this.configData = {names: [], description: '', arguments: []}
    }
}