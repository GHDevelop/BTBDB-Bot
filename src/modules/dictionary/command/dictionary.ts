import * as discord from 'discord.js';
import * as request from 'request';
import { Command } from "../../../base/module_base/command";
import { DiscordCommandInfo } from "../../../base/interface/command_info";
import { CommandProperties } from "../../../base/interface/command_properties";
import { Logger } from "../../../base/debug/logger";
import { EmbedColors } from '../../../base/enum/embed_colors';
import config from "../config.json";

export type WordInfo = {
    word: string,
    syllables: number,
    definitions: {
        partOfSpeech: string;
        definition: string;
    }[],
    pronunciation: string | undefined;
    frequency: number | undefined;
}

export class Dictionary extends Command{
    
    protected configData: CommandProperties

    private constructor(){
        super();

        this.configData.names = config.dictionary.names;
        this.configData.description = config.dictionary.description;
        this.configData.arguments = config.dictionary.arguments;
    }

    public processCommand(info: DiscordCommandInfo) {
        let update = info.arguments['update'] as boolean;
        let word = info.arguments['word'] as string;
        let encodedWord = encodeURIComponent(word);
        let api = config.dictionary.api;

        let datamuseUrl = `${api.baseUrl}?${api.spelledLike}${encodedWord}&${api.metadata}${api.definition}${api.syllables}${api.pronunciation}${api.frequency}`;

        let req = request.get({ uri: datamuseUrl }, (error: any, response: request.Response, body: any) => {
            if (error){
                Logger.logError(error);
                return;
            }

            let apiOutput = JSON.parse(body);
            let wordInfo = this.getInfoFromJson(apiOutput);

            if (wordInfo === undefined){
                info.channel.send(`Could not find a definition for ${word} or any similarly spelled words`);
                return;
            }

            this.outputInformation(wordInfo, info);
        });
    }

    //#region parse_api_output

    /**
     * Gets all the info needed about the word
     * 
     * @param apiOutput 
     * @param info 
     * @param word 
     */
    private getInfoFromJson(apiOutput: any) : WordInfo | undefined{
        if (apiOutput !== undefined && apiOutput.length > 0 && apiOutput[0].defs !== undefined){
            let returnedWord = apiOutput[0].word as string;
            let syllables = apiOutput[0].numSyllables as number;
            let definitions = this.parseDefinitions(apiOutput[0].defs);
            
            let tags = apiOutput[0].tags;
            let pronunciation = this.getPronunciation(tags);
            let frequencyAsPercent = this.getFrequency(tags);

            return {
                word: returnedWord,
                syllables: syllables,
                definitions: definitions,
                pronunciation: pronunciation,
                frequency: frequencyAsPercent
            }
        }
    }

    //#region definitions
    /**
     * Gets a list of definitions, each with their part of speech
     * 
     * @param defs 
     */
    private parseDefinitions(defs: any) : {partOfSpeech: string, definition: string}[] {
        let definitions: {partOfSpeech: string, definition: string}[] = [];

        for (let index = 0; index < defs.length; index++){
            let definition = defs[index] as string;
            let splitDefinition = this.splitPartOfSpeechFromDefinition(definition);
            definitions.push(splitDefinition);
        }


        return definitions;
    }

    /**
     * Gets a part of speech and a definition from the API's definition string
     * 
     * @param definition 
     */
    private splitPartOfSpeechFromDefinition(definition: string) : { partOfSpeech: string, definition: string } {
        let splitDefinition : { partOfSpeech: string, definition: string };
        splitDefinition = { 
            partOfSpeech: this.parsePartOfSpeech(definition.slice(0, definition.indexOf('\t'))),
            definition: definition.substr(definition.indexOf('\t') + 1, undefined)
        };

        return splitDefinition;
    }

    /**
     * replaces the API's simple part of speech notation with the full part of speech (for example, replaces n with noun)
     * 
     * @param partOfSpeech 
     */
    private parsePartOfSpeech(partOfSpeech : string) : string {
        let replaceParameters : { replace: RegExp, with: string }[] = [];

        config.dictionary.apiReturn.partsOfSpeech.forEach(part => {
            replaceParameters.push({
                replace: new RegExp(part.value),
                with: part.meaning
            })
        })

        for (let index = 0; index < replaceParameters.length; index++) {
            let replacedPartOfSpeech = partOfSpeech.replace(replaceParameters[index].replace, replaceParameters[index].with);
            if (replacedPartOfSpeech !== partOfSpeech){
                return replacedPartOfSpeech;
            }
        }

        return partOfSpeech;
    }
    //#endregion

    //#region pronunciation_and_frequency
    /**
     * gets a parameter provided a list of tags and the prefix that parameter uses in the api
     * 
     * @param tags 
     * @param toParse 
     */
    private parseFromTags(tags: any, toParse: string) : string | undefined {
        let tagsString = tags as string[];
        let parseRegex = new RegExp(toParse);
        for (let index = 0; index < tagsString.length; index++){
            if (parseRegex.test(tagsString[index])){
                return tagsString[index].substr(toParse.length, undefined);
            }
        }

        return undefined
    }

    //#region pronunciation
    /**
     * Gets the pronunciation of the word in a readable format
     * 
     * @param tags 
     */
    private getPronunciation(tags: any) : string | undefined {
        let pronunciation = this.parseFromTags(tags, config.dictionary.apiReturn.pronunciationPrefix);
        if (pronunciation) {
            pronunciation = this.formatPronunciation(pronunciation);
        }

        return pronunciation;
    }

    /**
     * Formats the pronunciation to make a little more sense by removing numbers and replacing spaces with dashes
     * 
     * @param pronunciation 
     */
    private formatPronunciation(pronunciation: string) : string {
        if (config.dictionary.outputProperties.pronunciation.removeNumbers)
        {
            pronunciation = pronunciation.replace(/[0-9]/g, '');
        }
        pronunciation = pronunciation.replace(/ /g, config.dictionary.outputProperties.pronunciation.replaceSpacesWith);
        if (pronunciation.endsWith(config.dictionary.outputProperties.pronunciation.replaceSpacesWith)){
            pronunciation = pronunciation.substr(0, pronunciation.length - 1);
        }

        return pronunciation
    }
    //#endregion

    /**
     * Gets the frequency of the word as a percentage (frequency is per 1,000,000 words when retrieved from api)
     * 
     * @param tags 
     */
    private getFrequency(tags: any) : number | undefined {
        let frequency = this.parseFromTags(tags, config.dictionary.apiReturn.frequencyPrefix);
        if (frequency) {
            //+ converts toFixed output back to number, and also shaves off extra decimal places
            return +((parseFloat(frequency) / config.dictionary.apiReturn.frequencyIsOutOf) * 100).toFixed(config.dictionary.outputProperties.frequency.decimalPlaces);
        }

        return undefined;
    }
    //#endregion

    //#endregion

    //#region present_information

    /**
     * Puts all the information into a discord embed, and then sends it
     * 
     * @param wordInfo 
     * @param info 
     */
    private outputInformation(wordInfo: WordInfo, info: DiscordCommandInfo){
        let wordAsOutput = this.convertWordForOutput(wordInfo.word);
        let embed = {
            color: EmbedColors.DARK_PURPLE,
            title: `${config.dictionary.outputProperties.outputIcon} **${wordAsOutput}**`,
            description: this.getWordDescription(wordInfo),
            fields: this.convertDefinitionsToFields(wordInfo.definitions)
        }


        info.channel.send({
            embed: embed
        });
    }

    /**
     * Capitalizes word if set to do so, otherwise returns the word
     * 
     * @param word 
     */
    private convertWordForOutput(word: string) : string {
        if (config.dictionary.outputProperties.capitalizeWord){
            return word.charAt(0).toUpperCase() + word.slice(1, undefined);
        }
        else {
            return word;
        }
    }

    /**
     * Gets the description of the word, which can contain the pronunciation, number of syllables, and/or frequency of the word in english text
     * 
     * @param wordInfo 
     */
    private getWordDescription(wordInfo: WordInfo) : string {
        let description: string = '';

        //Adds pronunciation to description
        if (wordInfo.pronunciation && config.dictionary.outputProperties.pronunciation.display) {
            description += `Pronounced: ${wordInfo.pronunciation} `;
        }

        //Adds number of syllables to description
        if (config.dictionary.outputProperties.displayNumSyllables)
        {
            description += `(${wordInfo.syllables} syllable`;
            description += wordInfo.syllables !== 1 ? 's)' : ')';
        }

        //Adds newline before frequency
        if (description !== '' && config.dictionary.outputProperties.frequency.display){
            description += '\n';
        }

        //Adds frequency to description
        if (wordInfo.frequency && config.dictionary.outputProperties.frequency.display) {
            description += `Is found in ${wordInfo.frequency}% of English text`;
        }

        return description;
    }

    /**
     * Converts the list of definitions to a usable set of fields
     * 
     * @param definitions 
     */
    private convertDefinitionsToFields(definitions: { partOfSpeech: string, definition: string }[]) : { name: string, value: string }[] {
        let definitionsAsFields: {
            name: string;
            value: string;
        }[] = [];

        definitions.forEach(definition => {
            definitionsAsFields.push({
                name: definition.partOfSpeech,
                value: definition.definition
            });
        });

        return definitionsAsFields;
    }
    //#endregion
}