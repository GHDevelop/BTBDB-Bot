import * as discord from 'discord.js'
import { Logger } from './src/base/debug/logger'
import auth from './auth.json'
import { CommandManager } from './src/base/module_management/command_manager';

class Boot {
    constructor() {
        Logger.setupLoggers();

        let bot : discord.Client = new discord.Client();
        bot.login(auth.token).then((msg : string) => {
            Logger.logInfo(`Logged in as: ${bot.user.tag}`);

            let commandManager = new CommandManager();
            commandManager.loadCommands(bot);
        }, (err : string) => {
            Logger.logError("Failed to log in");
        });
    }
}

export default new Boot();