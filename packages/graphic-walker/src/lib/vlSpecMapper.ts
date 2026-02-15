import { IChart, IMutField } from '../interfaces';
import { newChart } from '../models/visSpecHistory';
import { VegaliteMapper } from './vl2gw';

export function mapVegaLiteSpecToChart(vlSpec: unknown, meta: IMutField[], currentVisName: string, currentVisId: string): IChart {
    const emptyChart = newChart(meta, '');
    return VegaliteMapper(vlSpec, [...emptyChart.encodings.dimensions, ...emptyChart.encodings.measures], currentVisName, currentVisId);
}
