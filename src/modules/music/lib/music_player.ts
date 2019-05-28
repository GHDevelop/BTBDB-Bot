import * as discord from 'discord.js';
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { Logger } from "../../../base/debug/logger";
import config from '../config.json';
import userconfig from '../userconfig.json';

import * as fs from 'fs';
import ytdl from 'ytdl-core';

export class MusicPlayer {
    public static async startMusic(url: string, vc: discord.VoiceChannel, info: DiscordCommandInfo){
        let video = ytdl(url, {filter: 'audio'});
        if (video === undefined){
            Logger.logError(`no video`);
            return;
        }

        Logger.logInfo(vc.name);
        vc.join()
        .then((connection) => {
            const dispatcher = connection.playStream(video);
            dispatcher.on("end", end => {
                vc.leave();
            })
        })
        .catch(err => {
            Logger.logError(err);
        })
    }
}