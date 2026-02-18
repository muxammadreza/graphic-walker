export function readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        const cleanup = () => {
            reader.onload = null;
            reader.onerror = null;
            reader.onabort = null;
        };

        reader.onload = (event) => {
            cleanup();
            resolve(String(event.target?.result ?? ''));
        };

        reader.onerror = () => {
            cleanup();
            reject(reader.error ?? new Error('Failed to read file.'));
        };

        reader.onabort = () => {
            cleanup();
            reject(new DOMException('File read aborted', 'AbortError'));
        };

        reader.readAsText(file);
    });
}
