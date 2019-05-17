import {DiscordCommandInfo} from '../interface/command_info'
import {Logger} from '../debug/logger'

export abstract class Command{

    public abstract processCommand(info: DiscordCommandInfo) : void;
}