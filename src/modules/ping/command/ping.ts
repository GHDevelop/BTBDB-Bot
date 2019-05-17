import { Command } from "../../../base/abstract/command";
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { Logger } from "../../../base/debug/logger";

export class Ping extends Command{
    public processCommand(info: DiscordCommandInfo) {
        let ping = Date.now() - info.createdAt.valueOf();
        info.channel.send(ping);
    }
}