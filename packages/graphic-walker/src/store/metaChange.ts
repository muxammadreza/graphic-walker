import { IMutField } from '../interfaces';

type MetaChangeCallback = ((fid: string, diffMeta: Partial<IMutField>) => void) | undefined;

function fieldSignature(field: IMutField): string {
    return [
        field.fid,
        field.key ?? '',
        field.name ?? '',
        field.basename ?? '',
        field.semanticType ?? '',
        field.analyticType ?? '',
        String(field.offset ?? ''),
    ].join('|');
}

export function hasMetaChanged(previousMeta: IMutField[], nextMeta: IMutField[]): boolean {
    if (previousMeta.length !== nextMeta.length) {
        return true;
    }

    const previousSignatures = previousMeta.map(fieldSignature).sort();
    const nextSignatures = nextMeta.map(fieldSignature).sort();

    for (let i = 0; i < previousSignatures.length; i += 1) {
        if (previousSignatures[i] !== nextSignatures[i]) {
            return true;
        }
    }

    return false;
}

export function hasOnMetaChangeChanged(previousCallback: MetaChangeCallback, nextCallback: MetaChangeCallback): boolean {
    return previousCallback !== nextCallback;
}
