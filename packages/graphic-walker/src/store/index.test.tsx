import type { IMutField } from '../interfaces';
import { hasMetaChanged, hasOnMetaChangeChanged } from './metaChange';

const baseMeta: IMutField[] = [
    {
        fid: 'status',
        key: 'note.status',
        name: 'Status',
        basename: 'Status',
        semanticType: 'nominal',
        analyticType: 'dimension',
    },
];

describe('VizStoreWrapper', () => {
    it('detects onMetaChange callback changes even when metadata is unchanged', () => {
        const onMetaChangeA = jest.fn();
        const onMetaChangeB = jest.fn();

        expect(hasOnMetaChangeChanged(onMetaChangeA, onMetaChangeA)).toBe(false);
        expect(hasOnMetaChangeChanged(onMetaChangeA, onMetaChangeB)).toBe(true);
    });

    it('detects metadata changes when non-fid properties change', () => {
        const updatedMeta: IMutField[] = [
            {
                ...baseMeta[0],
                name: 'Status (renamed)',
                basename: 'Status (renamed)',
            },
        ];

        expect(hasMetaChanged(baseMeta, baseMeta)).toBe(false);
        expect(hasMetaChanged(baseMeta, updatedMeta)).toBe(true);
    });
});
