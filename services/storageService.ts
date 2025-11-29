import { ExportData } from '../types';

export interface StorageProvider {
    saveFile(data: ExportData, handle?: FileSystemFileHandle): Promise<FileSystemFileHandle>;
    openFile(): Promise<{ data: ExportData, handle: FileSystemFileHandle }>;
}

export const fileSystemStorageProvider: StorageProvider = {
    async saveFile(data: ExportData, handle?: FileSystemFileHandle): Promise<FileSystemFileHandle> {
        let fileHandle = handle;

        if (!fileHandle) {
            try {
                fileHandle = await window.showSaveFilePicker({
                    suggestedName: `structura-draft-${new Date().toISOString().split('T')[0]}.json`,
                    types: [{
                        description: 'Structura Project File',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    throw new Error('Save cancelled');
                }
                throw err;
            }
        }

        if (!fileHandle) throw new Error('No file handle');

        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();

        return fileHandle;
    },

    async openFile(): Promise<{ data: ExportData, handle: FileSystemFileHandle }> {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Structura Project File',
                    accept: { 'application/json': ['.json'] },
                }],
                multiple: false,
            });

            const file = await fileHandle.getFile();
            const text = await file.text();
            const data = JSON.parse(text) as ExportData;

            return { data, handle: fileHandle };
        } catch (err: any) {
            if (err.name === 'AbortError') {
                throw new Error('Open cancelled');
            }
            throw err;
        }
    }
};
