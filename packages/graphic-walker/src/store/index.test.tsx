import { describe, expect, it, vi } from 'bun:test';
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
        const onMetaChangeA = vi.fn();
        const onMetaChangeB = vi.fn();

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

    it('does not treat simple metadata reordering as a semantic change', () => {
        const reordered: IMutField[] = [
            {
                fid: 'age',
                key: 'note.age',
                name: 'Age',
                basename: 'Age',
                semanticType: 'quantitative',
                analyticType: 'measure',
            },
            ...baseMeta,
        ];
        const sameDifferentOrder: IMutField[] = [baseMeta[0], reordered[0]];

        expect(hasMetaChanged(reordered, sameDifferentOrder)).toBe(false);
    });
});
