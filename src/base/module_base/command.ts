import {DiscordCommandInfo} from '../interface/command_info'
import {Logger} from '../debug/logger'

export abstract class Command{

    protected abstract configData : {
        names : string[];
        arguments : string[];
    }

    protected constructor(){
        //Does nothing. Prevents error when running config in children, which requires super()
        this.setConfigData();
    }

    public getData(): {names: string[], arguments: string[]}{
        Logger.logInfo(this.configData.names[0]);
        return this.configData;
    }

    public abstract processCommand(info: DiscordCommandInfo) : void;

    private setConfigData() {
        this.configData = {names: [], arguments: []}
    }
}