import { useState, useEffect, useMemo, useRef } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import type { IFilterField, IRow, IViewField, IDataQueryWorkflowStep, IComputationFunction } from '../interfaces';
import { useAppRootContext } from '../components/appRoot';
import { toWorkflow } from '../utils/workflow';
import { dataQuery } from '../computation';
import { fold2 } from '../lib/op/fold';

interface UseRendererProps {
    allFields: IViewField[];
    viewDimensions: IViewField[];
    viewMeasures: IViewField[];
    filters: IFilterField[];
    defaultAggregated: boolean;
    sort: 'none' | 'ascending' | 'descending';
    limit: number;
    computationFunction: IComputationFunction;
    folds?: string[];
    timezoneDisplayOffset?: number;
}

interface UseRendererResult {
    viewData: IRow[];
    loading: boolean;
    parsed: {
        workflow: IDataQueryWorkflowStep[];
    };
}

export const useRenderer = (props: UseRendererProps): UseRendererResult => {
    const { allFields, viewDimensions, viewMeasures, filters, defaultAggregated, sort, limit, computationFunction, folds, timezoneDisplayOffset } = props;
    const [computing, setComputing] = useState(false);
    const taskIdRef = useRef(0);

    const workflow = useMemo(() => {
        return toWorkflow(
            filters,
            allFields,
            viewDimensions,
            viewMeasures,
            defaultAggregated,
            sort,
            folds,
            limit > 0 ? limit : undefined,
            timezoneDisplayOffset,
        );
    }, [filters, allFields, viewDimensions, viewMeasures, defaultAggregated, sort, folds, limit, timezoneDisplayOffset]);

    const [viewData, setViewData] = useState<IRow[]>([]);
    const [parsedWorkflow, setParsedWorkflow] = useState<IDataQueryWorkflowStep[]>([]);

    // Track last workflow hash to detect config-only changes (no workflow structure change)
    const lastWorkflowHashRef = useRef<string>('');

    const appRef = useAppRootContext();

    useEffect(() => {
        const taskId = ++taskIdRef.current;

        // Compute workflow hash to detect if structure actually changed
        const currentWorkflowHash = JSON.stringify(workflow);
        const workflowUnchanged = currentWorkflowHash === lastWorkflowHashRef.current;

        // Only show loading/computing state if workflow structure actually changed
        // This prevents the loading blink for Vega config changes (like serpentine)
        // which trigger rerenders but don't change the data workflow
        if (!workflowUnchanged) {
            appRef.current?.updateRenderStatus('computing');
            setComputing(true);
        }

        lastWorkflowHashRef.current = currentWorkflowHash;

        dataQuery(computationFunction, workflow, limit > 0 ? limit : undefined)
            .then((res) => fold2(res, defaultAggregated, allFields, viewMeasures, viewDimensions, folds))
            .then((data) => {
                if (taskId !== taskIdRef.current) {
                    return;
                }
                appRef.current?.updateRenderStatus('rendering');
                unstable_batchedUpdates(() => {
                    setComputing(false);
                    setViewData(data);
                    setParsedWorkflow(workflow);
                });
            })
            .catch((err) => {
                if (taskId !== taskIdRef.current) {
                    return;
                }
                appRef.current?.updateRenderStatus('error');
                console.error(err);
                unstable_batchedUpdates(() => {
                    setComputing(false);
                    setViewData([]);
                    setParsedWorkflow([]);
                });
            });
    }, [computationFunction, workflow]);

    const parseResult = useMemo(() => {
        return {
            workflow: parsedWorkflow,
        };
    }, [parsedWorkflow]);

    return useMemo(() => {
        return {
            viewData,
            loading: computing,
            parsed: parseResult,
        };
    }, [viewData, computing]);
};
