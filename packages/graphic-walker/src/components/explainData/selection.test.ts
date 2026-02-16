import type { IViewField } from '../../interfaces';
import { buildExplainPredicates, buildSelectionContext, resolveSelectionValue } from './selection';

const dimensionField = (overrides: Partial<IViewField>): IViewField => ({
    fid: 'field',
    name: 'Field',
    semanticType: 'nominal',
    analyticType: 'dimension',
    ...overrides,
});

describe('ExplainData selection helpers', () => {
    it('resolves selection values from field fid and aliases', () => {
        const byFid = resolveSelectionValue(
            dimensionField({ fid: 'ticker', name: 'Ticker', basename: 'Ticker' }),
            { ticker: 'MSFT' },
        );
        const byName = resolveSelectionValue(
            dimensionField({ fid: 'ticker', name: 'Ticker', basename: 'Ticker' }),
            { Ticker: 'AAPL' },
        );

        expect(byFid).toBe('MSFT');
        expect(byName).toBe('AAPL');
    });

    it('builds predicates for full valid selections', () => {
        const viewDimensions = [
            dimensionField({ fid: 'ticker', name: 'Ticker' }),
            dimensionField({ fid: 'region', name: 'Region' }),
        ];

        const predicates = buildExplainPredicates(viewDimensions, {
            ticker: 'MSFT',
            region: 'US',
        });

        expect(predicates).toHaveLength(2);
        expect(predicates[0].key).toBe('ticker');
        expect(predicates[1].key).toBe('region');
    });

    it('accepts boolean selections for discrete predicates', () => {
        const viewDimensions = [dimensionField({ fid: 'is_active', name: 'Is Active' })];

        const predicates = buildExplainPredicates(viewDimensions, {
            is_active: false,
        });

        expect(predicates).toHaveLength(1);
        expect(predicates[0].key).toBe('is_active');
        expect(predicates[0].type).toBe('discrete');
        if (predicates[0].type === 'discrete' && predicates[0].range instanceof Set) {
            expect(predicates[0].range.has(false)).toBe(true);
        }
    });

    it('excludes invalid selection values and supports partial selections', () => {
        const viewDimensions = [
            dimensionField({ fid: 'ticker', name: 'Ticker' }),
            dimensionField({ fid: 'score', name: 'Score' }),
        ];

        const predicates = buildExplainPredicates(viewDimensions, {
            ticker: 'MSFT',
            score: NaN,
        });

        expect(predicates).toHaveLength(1);
        expect(predicates[0].key).toBe('ticker');

        const context = buildSelectionContext(viewDimensions, predicates);
        expect(context).toEqual({
            matchedDimensions: 1,
            totalDimensions: 2,
            isPartialSelection: true,
        });
    });

    it('returns empty predicate list when no valid values exist', () => {
        const viewDimensions = [dimensionField({ fid: 'date', name: 'Date' })];

        const predicates = buildExplainPredicates(viewDimensions, {
            date: undefined,
        });

        expect(predicates).toHaveLength(0);

        const context = buildSelectionContext(viewDimensions, predicates);
        expect(context).toEqual({
            matchedDimensions: 0,
            totalDimensions: 1,
            isPartialSelection: false,
        });
    });
});
