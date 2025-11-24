import { IViewField, IRow } from '../interfaces';

/**
 * Utility functions for generating accessibility labels and descriptions for charts
 */

/**
 * Formats a field name for display in ARIA labels
 */
function formatFieldName(field: IViewField): string {
    return field.basename || field.name || field.fid;
}

/**
 * Formats aggregation name for display
 */
function formatAggregation(aggName?: string): string {
    if (!aggName || aggName === 'expr') return '';
    const aggMap: Record<string, string> = {
        sum: 'sum of',
        mean: 'average',
        median: 'median',
        max: 'maximum',
        min: 'minimum',
        count: 'count of',
    };
    return aggMap[aggName] || aggName;
}

/**
 * Generates a concise ARIA label for a chart
 *
 * @example
 * generateChartAriaLabel({
 *   geomType: 'bar',
 *   rows: [{ fid: 'revenue', aggName: 'sum' }],
 *   columns: [{ fid: 'category' }]
 * })
 * // Returns: "Bar chart showing sum of revenue by category"
 */
export function generateChartAriaLabel(props: {
    geomType: string;
    rows: readonly IViewField[];
    columns: readonly IViewField[];
    color?: IViewField;
    size?: IViewField;
    shape?: IViewField;
}): string {
    const { geomType, rows, columns, color, size, shape } = props;

    // Capitalize first letter of geom type
    const chartType = geomType.charAt(0).toUpperCase() + geomType.slice(1);

    const parts: string[] = [chartType, 'chart'];

    // Add row encodings (y-axis typically)
    if (rows.length > 0) {
        const rowDescriptions = rows
            .filter((f) => f.aggName !== 'expr')
            .map((f) => {
                const agg = formatAggregation(f.aggName);
                const name = formatFieldName(f);
                return agg ? `${agg} ${name}` : name;
            });

        if (rowDescriptions.length > 0) {
            parts.push('showing');
            parts.push(rowDescriptions.join(', '));
        }
    }

    // Add column encodings (x-axis typically)
    if (columns.length > 0) {
        const colNames = columns.filter((f) => f.aggName !== 'expr').map(formatFieldName);

        if (colNames.length > 0) {
            parts.push('by');
            parts.push(colNames.join(', '));
        }
    }

    // Add color encoding
    if (color) {
        parts.push(`colored by ${formatFieldName(color)}`);
    }

    // Add size encoding
    if (size) {
        const agg = formatAggregation(size.aggName);
        const name = formatFieldName(size);
        parts.push(`sized by ${agg ? agg + ' ' + name : name}`);
    }

    // Add shape encoding
    if (shape) {
        parts.push(`shaped by ${formatFieldName(shape)}`);
    }

    return parts.join(' ');
}

/**
 * Generates a detailed description for aria-describedby
 *
 * @example
 * generateLongDescription(vegaSpec, dataSource)
 * // Returns: "Bar chart with 150 data points. Categories: Electronics, Furniture, Office Supplies..."
 */
export function generateLongDescription(spec: any, dataSource: readonly IRow[]): string {
    const mark = spec.mark?.type || spec.mark || 'unknown';
    const count = dataSource.length;

    const parts: string[] = [];

    // Basic info
    parts.push(`${mark.charAt(0).toUpperCase() + mark.slice(1)} chart with ${count} data point${count !== 1 ? 's' : ''}.`);

    // Add encoding details if available
    const encoding = spec.encoding || {};

    // X-axis field
    if (encoding.x?.field) {
        const xField = encoding.x.field;
        const uniqueXValues = new Set(dataSource.map((d) => d[xField]));
        if (uniqueXValues.size <= 10) {
            parts.push(`Categories: ${Array.from(uniqueXValues).join(', ')}.`);
        } else {
            parts.push(`${uniqueXValues.size} categories on x-axis.`);
        }
    }

    // Y-axis aggregation
    if (encoding.y?.aggregate && encoding.y?.field) {
        parts.push(`Y-axis shows ${encoding.y.aggregate} of ${encoding.y.field}.`);
    }

    return parts.join(' ');
}

/**
 * Generates an ARIA label for a faceted chart
 *
 * @example
 * generateFacetAriaLabel(0, 1, rowField, colField)
 * // Returns: "Chart at row 1, column 2, showing data for Q1 and Electronics"
 */
export function generateFacetAriaLabel(rowIndex: number, colIndex: number, rowField?: IViewField, colField?: IViewField): string {
    const parts: string[] = [`Chart at row ${rowIndex + 1}, column ${colIndex + 1}`];

    if (rowField) {
        parts.push(`row facet: ${formatFieldName(rowField)}`);
    }

    if (colField) {
        parts.push(`column facet: ${formatFieldName(colField)}`);
    }

    return parts.join(', ');
}
