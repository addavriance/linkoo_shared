import LZString from 'lz-string';


export function validateRawData(rawData: string): boolean {
    if (!rawData || typeof rawData !== 'string') return false;
    if (rawData.length < 2 || rawData.length > 10000) return false;

    try {
        const decompressed = LZString.decompressFromEncodedURIComponent(rawData);
        if (!decompressed) return false;
        const parsed = JSON.parse(decompressed);
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
    } catch {
        return false;
    }
}
