import * as discord from 'discord.js';
import { Command } from "../../../base/module_base/command";
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { CommandProperties } from "../../../base/interface/command_properties";
import { Logger } from "../../../base/debug/logger";
import config from '../config.json';

export class PizzaTime extends Command{
    
    protected configData: CommandProperties

    private constructor(){
        super();

        this.configData.names = config.pizza_time.names;
    }

    public processCommand(info: DiscordCommandInfo) {
        let emotes = config.pizza_time.emotes;
        let message = `${emotes.confetti} ${emotes.pizza} ${emotes.p} ${emotes.i} ${emotes.z} ${emotes.z} ${emotes.a}         ${emotes.t} ${emotes.i} ${emotes.m} ${emotes.e} ${emotes.pizza} ${emotes.confetti}`;

        this.pizzaTimeMessage(info, message);
        this.pizzaTimeMessage(info, "@everyone");

        config.pizza_time.links.forEach(link => {
            this.pizzaTimeMessage(info, link);
        })
    }

    private pizzaTimeMessage(info: DiscordCommandInfo, toSend: string){
        info.channel.send(toSend).then(msg => this.reactToPizzaMessage(msg as discord.Message));
    }

    private async reactToPizzaMessage(msg: discord.Message){
        let emotes = config.pizza_time.emotes;
        let reactWith = [
            emotes.p,
            emotes.i,
            emotes.z,
            emotes.z2,
            emotes.a,
            emotes.t,
            emotes.i2,
            emotes.m,
            emotes.e,
            emotes.pizza
        ];

        for (let index = 0; index < reactWith.length; index++){
            await msg.react(reactWith[index]);
        }
    }
}