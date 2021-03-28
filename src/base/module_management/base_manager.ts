import * as fs from 'fs'
import * as path from 'path'
import { Logger } from '../debug/logger'
import { Client } from 'discord.js';
import { stringify } from 'querystring';

export abstract class BaseManager{

    //#region load_commands

    /**
     * Gets an instance of each command or passive (depending on which child used).
     * 
     * @param moduleDirectory 
     * @param fileDirectory 
     */
    protected static getClassList<ClassType>(moduleDirectory : string, fileDirectory : string, className : string, instanfeofComparison : (param : any) => boolean){
        let pathToModules = path.join(__dirname, moduleDirectory);
        let modules : string[] = this.getPathToModuleFolders(pathToModules);
        let scriptFilepaths = this.getPathToFileFolder(pathToModules, modules, fileDirectory);
        let scriptFiles = this.getFilesInFolder(scriptFilepaths);
        let classAndModules = this.getClassesFromFile<ClassType>(scriptFiles, className, instanfeofComparison);
        return classAndModules;
    }

    /**
     * takes in a script file, checks if it's an instantiatable instance of the class type, and then adds it to 
     * 
     * @param scriptFiles 
     */
    private static getClassesFromFile<ClassType>(scriptFiles: { module: string, file: any, filename: string }[], className : string, instanceofComparison : (param : any) => boolean): {classList: Record<string, ClassType[]>, moduleList: string[] } {
        let classItems : Record<string, ClassType[]> = {};
        let modules : string[] = [];

        scriptFiles.forEach(scriptFile => {
            try {
                for (let classString in scriptFile.file) {
                    //Apparently this grabs the entire script, or at least each class in it
                    let scriptType = scriptFile.file[classString];

                    //and that's recognized as a function
                    if (typeof scriptType === 'function') {
                        BaseManager.getClassFromValidFile<ClassType>(scriptType, instanceofComparison, classItems, scriptFile, modules);
                    }
                }
            }
            catch (err) {
                Logger.logError(`${scriptFile} could not be converted correctly to ${className}`);
                Logger.logError(err);
            }
        });

        return { classList: classItems, moduleList: modules };
    }

    /**
     * adds a script file, used in getClassesFromFile
     * 
     * @param scriptType 
     * @param instanceofComparison 
     * @param classItems 
     * @param scriptFile 
     * @param modules 
     */
    private static getClassFromValidFile<ClassType>(scriptType: any, instanceofComparison: (param: any) => boolean, classItems: Record<string, ClassType[]>, scriptFile: { module: string; file: any; filename: string; }, modules: string[]) {
        let objectOfType = new scriptType();

        if (instanceofComparison(objectOfType)) {
            if (classItems[scriptFile.module] === undefined) {
                classItems[scriptFile.module] = [];
                modules.push(scriptFile.module);
            }

            classItems[scriptFile.module].push(objectOfType);
            Logger.logInfo(`${scriptFile.filename} successfully added to module ${scriptFile.module}`);
        }
    }

    private static addOrExpandModule<ClassType>(classItems: { module: string; class: ClassType[]; }[], scriptFile: { module: string; file: any; filename: string; }, objectOfType: any) {
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
    private static getPathToModuleFolders(filepath: string): string[] {
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
    private static getPathToFileFolder(pathToModules: string, modules: string[], fileDirectory: string) : { module: string, path: string }[]{
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
    private static getFilesInFolder(scriptFilepaths: { module: string, path: string }[]) : { module: string, file: any, filename: string }[]{
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