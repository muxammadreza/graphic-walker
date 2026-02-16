import type { IDataQueryPayload, IDataQueryWorkflowStep, IFilterFiledSimple, IRow } from "../interfaces";
import { applyFilter, applySort, applyViewQuery, transformDataService } from "../services";
import { debugLog } from "../utils/debug";

export const dataQueryClient = async (
    rawData: IRow[],
    workflow: IDataQueryWorkflowStep[],
    offset?: number,
    limit?: number,
): Promise<IRow[]> => {
    debugLog('local query triggered', workflow);
    let res = rawData;
    for await (const step of workflow) {
        switch (step.type) {
            case 'filter': {
                res = await applyFilter(res, step.filters.map(filter => {
                    const res: IFilterFiledSimple = {
                        fid: filter.fid,
                        rule: filter.rule,
                    };
                    return res;
                }).filter(Boolean));
                break;
            }
            case 'transform': {
                res = await transformDataService(res, step.transform);
                break;
            }
            case 'view': {
                for await (const job of step.query) {
                    res = await applyViewQuery(res, job);
                }
                break;
            }
            case 'sort': {
                res = await applySort(res, step.by, step.sort);
                break;
            }
            default: {
                // @ts-expect-error - runtime check
                console.warn(new Error(`Unknown step type: ${step.type}`));
                break;
            }
        }
    }
    return res.slice(offset ?? 0, limit ? ((offset ?? 0) + limit) : undefined);
};

export const getComputation = (rawData: IRow[]) => (payload: IDataQueryPayload) => dataQueryClient(rawData, payload.workflow, payload.offset, payload.limit)
