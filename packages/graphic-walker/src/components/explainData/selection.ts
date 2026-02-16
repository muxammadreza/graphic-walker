import type { IPredicate, IViewField } from '../../interfaces';

export interface ISelectionContext {
    matchedDimensions: number;
    totalDimensions: number;
    isPartialSelection: boolean;
}

type SelectionValue = string | number | boolean;

const isValidSelectionValue = (value: unknown): value is SelectionValue => {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value);
    }

    if (typeof value === 'string') {
        return value.length > 0;
    }

    if (typeof value === 'boolean') {
        return true;
    }

    return false;
};

export const resolveSelectionValue = (
    field: Pick<IViewField, 'fid' | 'name' | 'basename'>,
    selectedMarkObject: Record<string, unknown>,
): SelectionValue | undefined => {
    const candidateKeys = [field.fid, field.name, field.basename].filter((key): key is string => typeof key === 'string' && key.length > 0);

    for (const key of candidateKeys) {
        if (!Object.prototype.hasOwnProperty.call(selectedMarkObject, key)) {
            continue;
        }

        const value = selectedMarkObject[key];
        if (isValidSelectionValue(value)) {
            return value;
        }
    }

    return undefined;
};

export const buildExplainPredicates = (viewDimensions: IViewField[], selectedMarkObject: Record<string, unknown>): IPredicate[] => {
    const predicates: IPredicate[] = [];

    for (const field of viewDimensions) {
        const value = resolveSelectionValue(field, selectedMarkObject);
        if (!isValidSelectionValue(value)) {
            continue;
        }

        predicates.push({
            key: field.fid,
            type: 'discrete',
            range: new Set([value]),
        });
    }

    return predicates;
};

export const buildSelectionContext = (viewDimensions: IViewField[], predicates: IPredicate[]): ISelectionContext => {
    const totalDimensions = viewDimensions.length;
    const matchedDimensions = predicates.length;

    return {
        matchedDimensions,
        totalDimensions,
        isPartialSelection: matchedDimensions > 0 && matchedDimensions < totalDimensions,
    };
};
