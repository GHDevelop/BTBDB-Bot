//@ts-ignore used to hide compile errors in example (not compiled, wrong directory). I highly recommend not using them when building a command
//Mandatory Includes
//@ts-ignore
import { Command } from "../../../base/module_base/command"; //This is the base class that all commands derive from.
//@ts-ignore
import { CommandProperties } from "../../../base/interface/command_properties"; //This is the datatype used to represent valuable command data. This includes information such as command names and arguments.
//@ts-ignore
import { DiscordCommandInfo } from "../../../base/interface/command_info"; //This is the datatype used to represent information tied to the message. It includes the full message itself as well as quick access to some of its more important properties.

//Highly Recommended Includes
//@ts-ignore
import { Logger } from "../../../base/debug/logger"; //This is an easy to use, winston based logger class. Could make development easier.
//@ts-ignore
import config from '../config.json'; //config.json needs to be added manually. It is recommended to store parameters for the project there.
//@ts-ignore
import userconfig from '../userconfig.json'; //userconfig.json needs to be added manually. This is where parameters you want the end user to modify will go, as this is what the bot's launcher will allow them to edit

//Usefulness Depends
import * as discord from 'discord.js'; //Mostly useful to get Discord's data types, such as GuildMember
//@ts-ignore
import { ExampleLibrary } from "../library/example_library.ts" //You may have other scripts aside from your command associated with the project.
//@ts-ignore
import { EmbedColors } from '../../../base/enum/embed_colors'; //Colors used for discord embeds
//@ts-ignore
import { ArgTypesEnum } from '../../../base/enum/arg_type'; //Possible argument types. Only really useful if making a help command
//@ts-ignore
import globalConfig from '../../../../config.json'; //The framework's config information
//@ts-ignore
import globalUserconfig from '../../../../userconfig.json'; //The framework's userconfig
//@ts-ignore
import * as some_node_module from 'some_node_module' //Whatever node modules you're using. Some examples include Jimp for image editing, fs to work with file systems, and request to utilize APIs

export class ExampleCommand extends Command { //all commands must extend Command in order to function correctly

    //configData is required by the base "Command" class. names and arguments are required properties, however additional properties can be added.
    protected configData: CommandProperties

    //Constructor for the command
    private constructor(){
        super();

        //information can be imported from sources other than config/userconfig (hard-coding the values can work for example)
        //userconfig should be used for information you want the user to edit, while config should be used for information you don't (such as arguments)
        this.configData.names = userconfig.exampleModule.names;
        this.configData.description = userconfig.exampleModule.description;
        this.configData.arguments = config.exampleModule.arguments;
    }

    //Method that processes the command. This is the method the bot will call when the command is recognized. DiscordCommandInfo is the data type included above, used to make accessing the information from the command message a little easier
    public processCommand(info: DiscordCommandInfo) {
        //Whatever you want to do with the command
        //Info contains the message with the command statement, the arguments from this.configData.arguments in a usable format, the bot's client, and a number of shortcuts to message parameters

        //to access an argument
        //@ts-ignore
        let a = info.arguments['example_one'] as Number;
        //@ts-ignore
        let b = info.argument['example_two'] as discord.GuildMember | discord.User;
        //@ts-ignore
        let c = info.argument['example_three'] as string;

        //accessing command information (in case you're making a help command)
        //@ts-ignore
        let d = this.getCommandDataForHelp();

        //Logging information
        //@ts-ignore
        Logger//.log method (logInfo(msg), logDebug(msg), etc.)
    }
}
