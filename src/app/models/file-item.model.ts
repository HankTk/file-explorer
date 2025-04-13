export interface FileItem {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number | null;
    type?: string;
    modified?: Date;
    created?: Date;
}
