export interface CommandProperties{
    names : string[];
    description: string;
    arguments : {
        name: string, 
        description?: string,
        type: string, 
        required?: boolean, 
        default?: any,
        isUnlimited?: boolean //Make sure that unlimited arguments are at the end of the argument list
    }[];
}