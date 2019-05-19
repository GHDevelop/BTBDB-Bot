//@ts-ignore used to hide compile errors in example (not compiled, wrong directory). I highly recommend not using them when building a command
//Mandatory Includes
//@ts-ignore
import { Command } from "../../../base/module_base/command"; //This is the base class that all commands derive from.
//@ts-ignore
import { CommandProperties } from "../../../base/interface/command_properties"; //This is the datatype used to represent valuable command data. This includes information such as command names and arguments.

//Highly Recommended Includes
//@ts-ignore
import { DiscordCommandInfo } from "../../../base/interface/command_info"; //This is the datatype used to represent information tied to the message. It includes the full message itself as well as quick access to some of its more important properties.
//@ts-ignore
import config from '../config.json'; //config.json needs to be added manually. It is recommended to store parameters for the project there.
//@ts-ignore
import { Logger } from "../../../base/debug/logger"; //This is an easy to use, winston based logger class. Could make development easier.

//Usefulness Depends
import * as discord from 'discord.js'; //Mostly useful to get Discord's data types, such as GuildMember
//@ts-ignore
import { ExampleLibrary } from "../library/example_library.ts" //You may have other scripts aside from your command associated with the project.
//@ts-ignore
import * as some_node_module from 'some_node_module' //Whatever node modules you're using. Some examples include Lodash and Jimp

export class ExampleCommand extends Command { //all commands must extend Command in order to function correctly

    //configData is required by the base "Command" class. names and arguments are required properties, however additional properties can be added.
    protected configData: CommandProperties

    //Constructor for the command
    private constructor(){
        super();

        //config being the config file included above. Highly recommend to instantiate configData from a config file, though other means (like hard-coding) will work.
        this.configData.names = config.exampleModule.names;
        this.configData.arguments = config.exampleModule.arguments;
    }

    //Method that processes the command. This is the method the bot will call when the command is recognized. DiscordCommandInfo is the data type included above, used to make accessing the information from the command message a little easier
    public processCommand(info: DiscordCommandInfo) {
        //Whatever you want to do with the command
    }
}
