import * as fs from 'fs'
import * as path from 'path'
import { Logger } from '../debug/logger'
import { Client } from 'discord.js';
import { stringify } from 'querystring';

export abstract class BaseManager<ClassType>{
    protected moduleList : string[] = []; //Used to allow forEach loops through classList
    protected classList : Record<string, ClassType[]> = {};

    /**
     * Workaround for instanceof check, which doesn't work with generic types. Should be return objectOfType instanceof ClassType (whatever that's defined as in child)
     * 
     * @param objectOfType 
     */
    protected abstract checkIfInstanceOf(objectOfType: any) : boolean;

    protected abstract runCommands(bot: Client) : void;

    //#region load_commands

    /**
     * Gets an instance of each command or passive (depending on which child used).
     * 
     * @param moduleDirectory 
     * @param fileDirectory 
     */
    protected getCommandList(moduleDirectory : string, fileDirectory : string){
        let pathToModules = path.join(__dirname, moduleDirectory);
        let modules : string[] = this.getPathToModuleFolders(pathToModules);
        let scriptFilepaths = this.getPathToFileFolder(pathToModules, modules, fileDirectory);
        let scriptFiles = this.getFilesInFolder(scriptFilepaths);
        let classAndModules = this.getClassesFromFile(scriptFiles);
        this.classList = classAndModules.classList;
        this.moduleList = classAndModules.moduleList;
    }

    /**
     * takes in a script file, checks if it's an instantiatable instance of the class type, and then adds it to 
     * 
     * @param scriptFiles 
     */
    private getClassesFromFile(scriptFiles: { module: string, file: any, filename: string }[]): {classList: Record<string, ClassType[]>, moduleList: string[] } {
        let classItems : Record<string, ClassType[]> = {};
        let modules : string[] = [];

        scriptFiles.forEach(scriptFile => {
            try {
                for (let classString in scriptFile.file) {
                    //Apparently this grabs the entire script, or at least each class in it
                    let scriptType = scriptFile.file[classString];

                    //and that's recognized as a function
                    if (typeof scriptType === 'function') {
                        let objectOfType = new scriptType();

                        if (this.checkIfInstanceOf(objectOfType)) {
                            if (classItems[scriptFile.module] === undefined){
                                classItems[scriptFile.module] = [];
                                modules.push(scriptFile.module);
                            }

                            classItems[scriptFile.module].push(objectOfType);
                            Logger.logInfo(`${scriptFile.filename} successfully added to module ${scriptFile.module}`);
                        }
                    }
                }
            }
            catch (err) {
                Logger.logError(`${scriptFile} could not be converted correctly to ${this.classList.constructor.name}`);
                Logger.logError(err);
            }
        });

        return { classList: classItems, moduleList: modules };
    }

    private addOrExpandModule(classItems: { module: string; class: ClassType[]; }[], scriptFile: { module: string; file: any; filename: string; }, objectOfType: any) {
        let modulePresent = false;
        for (let index = 0; index < classItems.length; index++) {
            if (classItems[index].module === scriptFile.module) {
                classItems[index].class.push(objectOfType);
                Logger.logInfo(`${scriptFile.filename} successfully added to module ${classItems[index].module}`);
                modulePresent = true;
            }
        }

        if (modulePresent === false) {
            classItems.push({ module: scriptFile.module, class: [objectOfType] });
            Logger.logInfo(`${scriptFile.module} added with ${scriptFile.filename}`);
        }
    }

    //#region get_files_from_paths

    /**
     * Gets the path to every module in the project.
     * 
     * @param filepath 
     */
    private getPathToModuleFolders(filepath: string): string[] {
        return fs.readdirSync(filepath)
                .filter(file => fs.statSync(path.join(filepath, file))
                .isDirectory());
    }

    /**
     * Gets the path to every file used by the manager from the module folder. Typically should be .../<module name>/<"command" or "passive">
     * 
     * @param pathToModules 
     * @param modules 
     * @param fileDirectory 
     */
    private getPathToFileFolder(pathToModules: string, modules: string[], fileDirectory: string) : { module: string, path: string }[]{
        let scriptFilepaths: { module: string, path: string }[] = [];
        modules.forEach(module => {
            let scriptPath = path.join(pathToModules, module, fileDirectory);
            if (fs.existsSync(scriptPath)){
                scriptFilepaths.push({ module: module, path: scriptPath });
            }
            else {
                Logger.logError(`no command directory for ${module} module`);
            }
        })

        return scriptFilepaths;
    }

    /**
     * Gets the file 
     * 
     * @param scriptFilepaths 
     */
    private getFilesInFolder(scriptFilepaths: { module: string, path: string }[]) : { module: string, file: any, filename: string }[]{
        //Filename field in data struct used exclusively for logging
        let scriptFiles: { module: string, file: any, filename: string }[] = [];
        
        scriptFilepaths.forEach(filepath => {
            let scriptFilenames = fs.readdirSync(filepath.path);
            scriptFilenames.forEach(scriptFilename => {
                if (scriptFilename.endsWith('.js'))
                {
                    try{
                        let scriptFile = require(path.join(filepath.path, scriptFilename));
                        scriptFiles.push({ module: filepath.module, file: scriptFile, filename: scriptFilename });
                    }
                    catch(err){
                        Logger.logError(`there appears to have been an issue loading ${scriptFilename}`);
                        Logger.logError(err);
                    }
                }
            });
        });

        return scriptFiles;
    }
    //#endregion
    //#endregion
}