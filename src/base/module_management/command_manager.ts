import * as discord from 'discord.js'
import * as fs from 'fs'
import * as path from 'path'
import { Logger } from '../debug/logger'
import { Command } from '../abstract/command'

const baseCommandDirectory = '../../modules';
const commandDirectory = 'command';

export class CommandManager {
    private static commandsList : Command[];

    public static getCommandList(){
        //Reset command list
        this.commandsList = [];

        let filepath = path.join(__dirname, baseCommandDirectory);
        let files : string[] = CommandManager.getPathToModuleFolders(filepath);

        CommandManager.getCommandsForModule(files, filepath);
    }

    private static getCommandsForModule(files: string[], filepath: string) {
        files.forEach(file => {
            let commandPath = path.join(filepath, file, commandDirectory);
            if (fs.existsSync(commandPath)) {
                let commandDirectoryFilenames = fs.readdirSync(commandPath);

                commandDirectoryFilenames.forEach(commandFilename => {
                    try {
                        let commandFile = require(path.join(commandPath, commandFilename));

                        for (let className in commandFile) {
                            //Apparently this grabs the entire script, or at least each class in it
                            let commandType = commandFile[className];

                            //and that's recognized as a function
                            if (typeof commandType === 'function') {
                                let currentCommand = new commandType();

                                //Make sure that any commands added actually extend "Command", which is found at src/base/abstract
                                if (currentCommand instanceof Command) {
                                    this.commandsList.push(currentCommand);
                                    Logger.logInfo(`${commandFilename} successfully added`);
                                }
                            }
                        }
                    }
                    catch (err) {
                        Logger.logError(`${commandFilename} does not extend Command or something`);
                        Logger.logError(err);
                    }
                });
            }
            else {
                Logger.logError(`no command directory for ${file} module`);
            }
        });
    }

    private static getPathToModuleFolders(filepath: string): string[] {
        return fs.readdirSync(filepath)
                .filter(file => fs.statSync(path.join(filepath, file))
                .isDirectory());
    }
}