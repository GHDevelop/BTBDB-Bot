import * as discord from 'discord.js'
import { Logger } from './src/base/debug/logger'
import auth from './auth.json'
import { CommandManager } from './src/base/module_management/command_manager';

class Boot {
    constructor() {
        Logger.setupLoggers();

        let bot : discord.Client = new discord.Client();
        bot.login(auth.token).then((msg : string) => {
            Logger.logInfo(`Logged in as: ${bot.user.username}-(${bot.user.id})`);
        }, (err : string) => {
            Logger.logError("something's wrong");
        });

        //this.pong(bot);
    }

    private pong(bot: discord.Client) {
        bot.on('message', function (message: discord.Message) {
            if (message.content.substring(0, 1) == '!') {
                let args = message.content.substring(1).split(' ');
                let cmd = args[0];
                switch (cmd) {
                    case 'ping':
                        message.channel.send(CommandManager.getCommandList());
                }
            }
        });
    }
}

export default new Boot();