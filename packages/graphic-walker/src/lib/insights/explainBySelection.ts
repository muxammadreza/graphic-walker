import { IPredicate, IField, IRow, IViewField, IComputationFunction, IDataQueryWorkflowStep } from '../../interfaces';
import { filterByPredicates, getMeaAggKey } from '../../utils';
import { compareDistributionJS, normalizeWithParent } from '../../utils/normalization';
import { debugLog } from '../../utils/debug';
import { VizSpecStore } from '../../store/visualSpecStore';
import { complementaryFields } from './utils';
import { toWorkflow } from '../../utils/workflow';
import { dataQuery } from '../../computation/index';

const QUANT_BIN_NUM = 10;

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export interface ExplainBySelectionResult {
    score: number;
    measureKey: string;
    measureField: IField;
    targetField: IField;
    normalizedData: IRow[];
    normalizedParentData: IRow[];
}

export async function explainBySelection(props: {
    predicates: IPredicate[];
    viewFilters: VizSpecStore['viewFilters'];
    allFields: IViewField[];
    viewMeasures: IViewField[];
    viewDimensions: IViewField[];
    computationFunction: IComputationFunction;
    timezoneDisplayOffset: number | undefined;
}) {
    const { allFields, viewFilters, viewMeasures, viewDimensions, predicates, computationFunction, timezoneDisplayOffset } = props;
    const complementaryDimensions = complementaryFields({
        all: allFields.filter((f) => f.analyticType === 'dimension'),
        selection: viewDimensions,
    });
    const outlierList: ExplainBySelectionResult[] = [];
    for (let extendDim of complementaryDimensions) {
        let extendDimFid = extendDim.fid;
        let extraPreWorkflow: IDataQueryWorkflowStep[] = [];
        if (extendDim.semanticType === 'quantitative') {
            extraPreWorkflow.push({
                type: 'transform',
                transform: [
                    {
                        key: extendDimFid,
                        expression: {
                            op: 'bin',
                            as: extendDimFid,
                            num: QUANT_BIN_NUM,
                            params: [
                                {
                                    type: 'field',
                                    value: extendDim.fid,
                                },
                            ],
                        },
                    },
                ],
            });
        }
        for (let mea of viewMeasures) {
            const measureKey = getMeaAggKey(mea.fid, mea.aggName ?? 'sum');
            const overallWorkflow = toWorkflow(viewFilters, allFields, [extendDim], [mea], true, 'none', [], undefined, timezoneDisplayOffset);
            const fullOverallWorkflow = [...extraPreWorkflow, ...overallWorkflow];
            const overallData = await dataQuery(computationFunction, fullOverallWorkflow);
            if (overallData.length === 0) {
                continue;
            }

            const viewWorkflow = toWorkflow(viewFilters, allFields, [...viewDimensions, extendDim], [mea], true, 'none', [], undefined, timezoneDisplayOffset);
            const fullViewWorkflow = [...extraPreWorkflow, ...viewWorkflow];
            const viewData = await dataQuery(computationFunction, fullViewWorkflow);
            if (viewData.length === 0) {
                continue;
            }

            const subData = filterByPredicates(viewData, predicates);
            if (subData.length === 0) {
                continue;
            }

            const finiteOverallData = overallData.filter((row) => isFiniteNumber(row[measureKey]));
            const finiteSubData = subData.filter((row) => isFiniteNumber(row[measureKey]));
            if (finiteOverallData.length === 0 || finiteSubData.length === 0) {
                continue;
            }

            const parentTotal = finiteOverallData.reduce((sum, row) => sum + Math.abs(row[measureKey] as number), 0);
            const subsetTotal = finiteSubData.reduce((sum, row) => sum + Math.abs(row[measureKey] as number), 0);
            if (!Number.isFinite(parentTotal) || !Number.isFinite(subsetTotal) || parentTotal <= 0 || subsetTotal <= 0) {
                continue;
            }

            debugLog('ExplainData Debug:', {
                dim: extendDim.fid,
                mea: mea.fid,
                overallDataLen: overallData.length,
                viewDataLen: viewData.length,
                subDataLen: subData.length,
                predicates,
            });

            const outlierNormalization = normalizeWithParent(finiteSubData, finiteOverallData, [measureKey], false);
            const normalizedData = outlierNormalization.normalizedData.filter((row) => isFiniteNumber(row[measureKey]));
            const normalizedParentData = outlierNormalization.normalizedParentData.filter((row) => isFiniteNumber(row[measureKey]));
            if (normalizedData.length === 0 || normalizedParentData.length === 0) {
                continue;
            }
            const outlierScore = compareDistributionJS(
                normalizedData,
                normalizedParentData,
                [extendDim.fid],
                measureKey,
            );
            if (!Number.isFinite(outlierScore)) {
                continue;
            }

            outlierList.push({
                measureKey,
                measureField: mea,
                targetField: extendDim,
                score: outlierScore,
                normalizedData,
                normalizedParentData,
            });
        }
    }
    return outlierList.sort(
        (a, b) => b.score - a.score || a.targetField.fid.localeCompare(b.targetField.fid) || a.measureField.fid.localeCompare(b.measureField.fid),
    );
}
