import * as discord from 'discord.js';
import { Command } from "../../../base/module_base/command";
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { CommandProperties } from "../../../base/interface/command_properties";
import { Logger } from "../../../base/debug/logger";
import config from '../config.json';
import userconfig from '../userconfig.json';

import { MusicPlayer } from '../lib/music_player';
import { MusicRegexp } from '../enum/regexp';

export class MusicPlay extends Command {
    protected configData: CommandProperties;

    private constructor(){
        super();

        this.configData.names = userconfig.play.names;
        this.configData.description = userconfig.play.description;
        this.configData.arguments = config.play.arguments;
    }

    public processCommand(info: DiscordCommandInfo) {
        if (info.authorGuildMember === null){
            info.channel.send(userconfig.errors.musicInDM);
            return;
        }

        if (info.authorGuildMember.voiceChannel === undefined){
            info.channel.send(userconfig.errors.playWhileNotInVoiceChat);
            return;
        }

        let music = info.arguments['url'] as string;
        let youtubeRegexp = new RegExp(MusicRegexp.YoutubeUrl);

        let musicAsUrl = youtubeRegexp.exec(music);
        if (musicAsUrl === null){
            info.channel.send(userconfig.errors.UrlNotMusic);
            return;
        }

        MusicPlayer.startMusic(musicAsUrl[0], info.authorGuildMember.voiceChannel, info);
    }
}