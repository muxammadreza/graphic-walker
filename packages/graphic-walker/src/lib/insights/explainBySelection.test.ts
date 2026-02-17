import { beforeEach, describe, expect, it, vi } from 'bun:test';
import type { IComputationFunction, IPredicate, IRow, IViewField } from '../../interfaces';
import { dataQuery } from '../../computation/index';
import { explainBySelection } from './explainBySelection';

void vi.mock('../../utils/workflow', () => ({
    toWorkflow: vi.fn(() => []),
}));

void vi.mock('../../computation/index', () => ({
    dataQuery: vi.fn(),
}));

void vi.mock('../../utils/normalization', () => ({
    normalizeWithParent: vi.fn((selected: IRow[], parent: IRow[]) => ({
        normalizedData: selected,
        normalizedParentData: parent,
    })),
    compareDistributionJS: vi.fn(() => 0.5),
}));

const makeField = (overrides: Partial<IViewField>): IViewField => ({
    fid: 'field',
    name: 'Field',
    semanticType: 'nominal',
    analyticType: 'dimension',
    ...overrides,
});

const mockedDataQuery = dataQuery as unknown as ReturnType<typeof vi.fn>;
const noopComputation = (async () => []) as IComputationFunction;

describe('explainBySelection', () => {
    const dayOfWeek = makeField({ fid: 'day_of_week', name: 'day_of_week', semanticType: 'nominal', analyticType: 'dimension' });
    const hour = makeField({ fid: 'hour', name: 'hour', semanticType: 'nominal', analyticType: 'dimension' });
    const region = makeField({ fid: 'region', name: 'region', semanticType: 'nominal', analyticType: 'dimension' });
    const activityCount = makeField({
        fid: 'activity_count',
        name: 'activity_count',
        semanticType: 'quantitative',
        analyticType: 'measure',
        aggName: 'sum',
    });

    const predicates: IPredicate[] = [
        {
            key: 'day_of_week',
            type: 'discrete',
            range: new Set(['Saturday']),
        },
    ];

    beforeEach(() => {
        mockedDataQuery.mockReset();
    });

    it('returns finite explain result when parent and subset data are valid', async () => {
        mockedDataQuery
            .mockResolvedValueOnce([
                { hour: '09', activity_count_sum: 10 },
                { hour: '10', activity_count_sum: 20 },
            ])
            .mockResolvedValueOnce([
                { day_of_week: 'Saturday', hour: '09', activity_count_sum: 5 },
                { day_of_week: 'Saturday', hour: '10', activity_count_sum: 15 },
                { day_of_week: 'Sunday', hour: '09', activity_count_sum: 12 },
            ]);

        const result = await explainBySelection({
            predicates,
            viewFilters: [],
            allFields: [dayOfWeek, hour, activityCount],
            viewMeasures: [activityCount],
            viewDimensions: [dayOfWeek],
            computationFunction: noopComputation,
            timezoneDisplayOffset: undefined,
        });

        expect(result).toHaveLength(1);
        expect(result[0].targetField.fid).toBe('hour');
        expect(result[0].measureKey).toBe('activity_count_sum');
        expect(Number.isFinite(result[0].score)).toBe(true);
        expect(result[0].normalizedData.length).toBeGreaterThan(0);
        expect(result[0].normalizedParentData.length).toBeGreaterThan(0);
    });

    it('skips entries when selected subset is empty', async () => {
        mockedDataQuery
            .mockResolvedValueOnce([
                { hour: '09', activity_count_sum: 10 },
                { hour: '10', activity_count_sum: 20 },
            ])
            .mockResolvedValueOnce([{ day_of_week: 'Sunday', hour: '09', activity_count_sum: 12 }]);

        const result = await explainBySelection({
            predicates,
            viewFilters: [],
            allFields: [dayOfWeek, hour, activityCount],
            viewMeasures: [activityCount],
            viewDimensions: [dayOfWeek],
            computationFunction: noopComputation,
            timezoneDisplayOffset: undefined,
        });

        expect(result).toEqual([]);
    });

    it('skips entries with non-finite or zero-sum measure values', async () => {
        mockedDataQuery
            .mockResolvedValueOnce([
                { hour: '09', activity_count_sum: 0 },
                { hour: '10', activity_count_sum: 0 },
            ])
            .mockResolvedValueOnce([
                { day_of_week: 'Saturday', hour: '09', activity_count_sum: 0 },
                { day_of_week: 'Saturday', hour: '10', activity_count_sum: 0 },
            ]);

        const result = await explainBySelection({
            predicates,
            viewFilters: [],
            allFields: [dayOfWeek, hour, activityCount],
            viewMeasures: [activityCount],
            viewDimensions: [dayOfWeek],
            computationFunction: noopComputation,
            timezoneDisplayOffset: undefined,
        });

        expect(result).toEqual([]);
    });

    it('sorts ties deterministically by target field id', async () => {
        mockedDataQuery
            .mockResolvedValueOnce([{ hour: '09', activity_count_sum: 10 }])
            .mockResolvedValueOnce([{ day_of_week: 'Saturday', hour: '09', activity_count_sum: 10 }])
            .mockResolvedValueOnce([{ region: 'US', activity_count_sum: 10 }])
            .mockResolvedValueOnce([{ day_of_week: 'Saturday', region: 'US', activity_count_sum: 10 }]);

        const result = await explainBySelection({
            predicates,
            viewFilters: [],
            allFields: [dayOfWeek, region, hour, activityCount],
            viewMeasures: [activityCount],
            viewDimensions: [dayOfWeek],
            computationFunction: noopComputation,
            timezoneDisplayOffset: undefined,
        });

        expect(result).toHaveLength(2);
        expect(result[0].targetField.fid).toBe('hour');
        expect(result[1].targetField.fid).toBe('region');
    });
});
