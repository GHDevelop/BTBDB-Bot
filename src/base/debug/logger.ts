import * as winston from 'winston';
import { Format } from 'logform';

//TODO: move to config file, figure out how to store and use formats in json
const consoleLogFormat = winston.format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

const fileLogFormat = winston.format.printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

/**
 * Easy manager for Winston logger
 */
export class Logger {
    private static logger : winston.Logger;

    //#region setup_loggers
    /**
     * Sets up all loggers used in the bot by default. This currently includes the console log, file log, and error file log
     */
    public static setupLoggers(){
        Logger.setupLogger('debug', consoleLogFormat);
        Logger.addTransports([new winston.transports.Console]);
        Logger.addTransports(Logger.getFileTransports([
            {name: 'error.log', level: 'error'},
            {name: 'all.log', level: 'debug'}
        ]));
    }

    /**
     * Adds a group of either file transports or console transports to the transport list
     * 
     * @param transports 
     */
    private static addTransports(transports: winston.transports.ConsoleTransportInstance[] | winston.transports.FileTransportInstance[]){
        for (let index = 0; index < transports.length; index++){
            this.logger.add(transports[index]);
        }
    }

    /**
     * Configures transports for file loggers (and the level each file uses) and returns them
     * 
     * @param level
     * @param format
     * @param files 
     */
    private static getFileTransports(files: {name: string, level: string}[]) : winston.transports.FileTransportInstance[]{
        let transports : winston.transports.FileTransportInstance[] = [];

        for (let index = 0; index < files.length; index++){
            transports.push(new winston.transports.File({filename: files[index].name, dirname: 'logs', level: files[index].level}));
        }
        
        return transports;
    }

    /**
     * Sets up a colorized, timestamped logger that outputs to a set of transports with a specific format. Transports set up separately
     * 
     * @param level 
     * @param format 
     * @param transports 
     */
    private static setupLogger(level: string, format: Format) {
        this.logger = winston.createLogger({
            level: level,
            format: winston.format.combine(
                winston.format.label({ label: 'core logger' }), 
                winston.format.colorize(), 
                winston.format.timestamp(), 
                format)
        });
    }
    //#endregion
    //#region logger_access
    public static logError(msg: string){
        this.logger.error(msg);
    }

    public static logDebug(msg: string){
        this.logger.debug(msg);
    }

    public static logInfo(msg: string){
        this.logger.info(msg);
    }

    public static logWarning(msg: string){
        this.logger.warning(msg);
    }
    //#endregion
}