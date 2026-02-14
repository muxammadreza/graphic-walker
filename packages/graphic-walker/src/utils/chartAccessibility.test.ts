import type { IViewField } from '../interfaces';
import { generateChartAriaLabel, generateLongDescription, generateFacetAriaLabel } from './chartAccessibility';

describe('chartAccessibility utilities', () => {
    describe('generateChartAriaLabel', () => {
        it('should generate label for simple bar chart', () => {
            const label = generateChartAriaLabel({
                geomType: 'bar',
                rows: [{ fid: 'revenue', name: 'Revenue', aggName: 'sum' } as IViewField],
                columns: [{ fid: 'category', name: 'Category' } as IViewField],
            });

            expect(label).toContain('Bar chart');
            expect(label).toContain('sum of Revenue');
            expect(label).toContain('Category');
        });

        it('should generate label for line chart with multiple encodings', () => {
            const label = generateChartAriaLabel({
                geomType: 'line',
                rows: [{ fid: 'sales', name: 'Sales', aggName: 'sum' } as IViewField],
                columns: [{ fid: 'date', name: 'Date' } as IViewField],
                color: { fid: 'region', name: 'Region' } as IViewField,
            });

            expect(label).toContain('Line chart');
            expect(label).toContain('sum of Sales');
            expect(label).toContain('Date');
            expect(label).toContain('colored by Region');
        });

        it('should handle point chart with size encoding', () => {
            const label = generateChartAriaLabel({
                geomType: 'point',
                rows: [{ fid: 'profit', name: 'Profit' } as IViewField],
                columns: [{ fid: 'quantity', name: 'Quantity' } as IViewField],
                size: { fid: 'discount', name: 'Discount' } as IViewField,
            });

            expect(label).toContain('Point chart');
            expect(label).toContain('sized by Discount');
        });

        it('should handle chart with shape encoding', () => {
            const label = generateChartAriaLabel({
                geomType: 'point',
                rows: [{ fid: 'x', name: 'X' } as IViewField],
                columns: [{ fid: 'y', name: 'Y' } as IViewField],
                shape: { fid: 'category', name: 'Category' } as IViewField,
            });

            expect(label).toContain('Point chart');
            expect(label).toContain('shaped by Category');
        });

        it('should handle multiple rows and columns', () => {
            const label = generateChartAriaLabel({
                geomType: 'bar',
                rows: [{ fid: 'revenue', name: 'Revenue', aggName: 'sum' } as IViewField, { fid: 'profit', name: 'Profit', aggName: 'avg' } as IViewField],
                columns: [{ fid: 'category', name: 'Category' } as IViewField, { fid: 'quarter', name: 'Quarter' } as IViewField],
            });

            expect(label).toContain('Bar chart');
            expect(label).toContain('sum of Revenue');
            expect(label).toContain('avg Profit');
        });

        it('should handle empty encodings gracefully', () => {
            const label = generateChartAriaLabel({
                geomType: 'bar',
                rows: [],
                columns: [],
            });

            expect(label).toBe('Bar chart');
        });

        it('should capitalize chart type correctly', () => {
            const types = ['bar', 'line', 'point', 'area', 'circle', 'tick'];

            types.forEach((type) => {
                const label = generateChartAriaLabel({
                    geomType: type,
                    rows: [],
                    columns: [],
                });

                const capitalized = type.charAt(0).toUpperCase() + type.slice(1);
                expect(label).toContain(`${capitalized} chart`);
            });
        });
    });

    describe('generateLongDescription', () => {
        it('should generate description with data point count', () => {
            const spec = { mark: 'bar' };
            const dataSource = [
                { category: 'A', value: 10 },
                { category: 'B', value: 20 },
                { category: 'C', value: 30 },
            ];

            const description = generateLongDescription(spec, dataSource);

            expect(description).toContain('3 data points');
        });

        it('should handle empty dataset', () => {
            const spec = { mark: 'line' };
            const dataSource: any[] = [];

            const description = generateLongDescription(spec, dataSource);

            expect(description).toContain('0 data points');
        });

        it('should include chart type from spec', () => {
            const spec = { mark: 'point' };
            const dataSource = [{ x: 1, y: 2 }];

            const description = generateLongDescription(spec, dataSource);

            expect(description).toContain('Point chart');
        });

        it('should handle large datasets', () => {
            const spec = { mark: 'bar' };
            const dataSource = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: i * 10 }));

            const description = generateLongDescription(spec, dataSource);

            expect(description).toContain('1000 data points');
        });
    });

    describe('generateFacetAriaLabel', () => {
        it('should generate label for simple facet position', () => {
            const label = generateFacetAriaLabel(0, 0, { fid: 'quarter', name: 'Quarter' } as IViewField, { fid: 'region', name: 'Region' } as IViewField);

            expect(label).toContain('row 1');
            expect(label).toContain('column 1');
            expect(label).toContain('Quarter');
            expect(label).toContain('Region');
        });

        it('should handle only row facet', () => {
            const label = generateFacetAriaLabel(2, 0, { fid: 'category', name: 'Category' } as IViewField, undefined);

            expect(label).toContain('row 3');
            expect(label).toContain('column 1');
            expect(label).toContain('Category');
            expect(label).not.toContain('undefined');
        });

        it('should handle only column facet', () => {
            const label = generateFacetAriaLabel(0, 1, undefined, { fid: 'region', name: 'Region' } as IViewField);

            expect(label).toContain('row 1');
            expect(label).toContain('column 2');
            expect(label).toContain('Region');
        });

        it('should handle no facets', () => {
            const label = generateFacetAriaLabel(0, 0, undefined, undefined);

            expect(label).toContain('row 1');
            expect(label).toContain('column 1');
            expect(label).not.toContain('row facet');
            expect(label).not.toContain('column facet');
        });

        it('should use 1-indexed positions', () => {
            const tests = [
                { row: 0, col: 0, expected: 'row 1, column 1' },
                { row: 1, col: 2, expected: 'row 2, column 3' },
                { row: 5, col: 10, expected: 'row 6, column 11' },
            ];

            tests.forEach(({ row, col, expected }) => {
                const label = generateFacetAriaLabel(row, col, undefined, undefined);
                expect(label).toContain(expected);
            });
        });

        it('should handle facets with basename', () => {
            const label = generateFacetAriaLabel(
                0,
                0,
                { fid: 'q', basename: 'Q1', name: 'Quarter 1' } as IViewField,
                { fid: 'r', basename: 'West', name: 'Western Region' } as IViewField,
            );

            // Should prefer basename over name
            expect(label).toContain('Q1');
            expect(label).toContain('West');
        });
    });

    describe('edge cases', () => {
        it('should handle fields without names', () => {
            const label = generateChartAriaLabel({
                geomType: 'bar',
                rows: [{ fid: 'field1' } as IViewField],
                columns: [],
            });

            expect(label).toContain('Bar chart');
            expect(label).toContain('field1');
        });

        it('should handle special characters in field names', () => {
            const label = generateChartAriaLabel({
                geomType: 'line',
                rows: [{ fid: 'rev_2024', name: 'Revenue (2024)' } as IViewField],
                columns: [{ fid: 'cat_name', name: 'Category/Name' } as IViewField],
            });

            expect(label).toContain('Revenue (2024)');
            expect(label).toContain('Category/Name');
        });
    });
});
