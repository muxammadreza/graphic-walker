import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useCompututaion, useVizStore } from '../../store';
import styled from 'styled-components';
import embed, { type Result } from 'vega-embed';
import type { TopLevelSpec } from 'vega-lite';
import { VegaGlobalConfig, IThemeKey, IField, IRow } from '../../interfaces';
import { builtInThemes } from '../../vis/theme';
import { explainBySelection, type ExplainBySelectionResult } from '../../lib/insights/explainBySelection';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import LoadingLayer from '../loadingLayer';
import { themeContext } from '@/store/theme';
import { Button } from '../ui/button';
import { debugWarn } from '../../utils/debug';
import { buildExplainPredicates, buildSelectionContext, resolveSelectionValue, type ISelectionContext } from './selection';

const Container = styled.div`
    height: 50vh;
    overflow-y: hidden;
`;
const TabsList = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: stretch;
    height: 100%;
    overflow-y: scroll;
`;

const Tab = styled.div`
    margin-block: 0.2em;
    margin-inline: 0.2em;
    padding: 0.5em;
    border-width: 2px;
    cursor: pointer;
`;

type ExplainPanelStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

const getCategoryName = (row: IRow, field: IField): string => {
    if (field.semanticType === 'quantitative') {
        const value = row[field.fid];
        if (
            Array.isArray(value) &&
            value.length >= 2 &&
            typeof value[0] === 'number' &&
            typeof value[1] === 'number' &&
            Number.isFinite(value[0]) &&
            Number.isFinite(value[1])
        ) {
            return `${value[0].toFixed(2)}-${value[1].toFixed(2)}`;
        }
        return 'Unknown range';
    }

    const value = row[field.fid];
    if (value === undefined || value === null || value === '') {
        return 'Unknown';
    }
    return String(value);
};

const EMPTY_SELECTION_MESSAGE = 'Select a mark with at least one valid dimension value to generate explanations.';
const EMPTY_RESULT_MESSAGE = 'No explainable patterns were found for the selected context.';
const INVALID_RENDER_DATA_MESSAGE = 'No valid numeric values are available to render this explanation.';
const ERROR_MESSAGE = 'Unable to generate explanations right now. Please try again.';
const EXPLAIN_CATEGORY_FIELD = '__gw_explain_category';
const EXPLAIN_SCOPE_FIELD = '__gw_explain_scope';
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const ExplainData: React.FC<{
    themeKey: IThemeKey;
}> = observer(({ themeKey }) => {
    const vizStore = useVizStore();
    const dark = useContext(themeContext);
    const computationFunction = useCompututaion();
    const { allFields, viewMeasures, viewDimensions, viewFilters, showInsightBoard, selectedMarkObject, config } = vizStore;
    const { timezoneDisplayOffset } = config;
    const [explainDataInfoList, setExplainDataInfoList] = useState<ExplainBySelectionResult[]>([]);
    const [selectedInfoIndex, setSelectedInfoIndex] = useState(0);
    const [status, setStatus] = useState<ExplainPanelStatus>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [selectionContext, setSelectionContext] = useState<ISelectionContext>({
        matchedDimensions: 0,
        totalDimensions: 0,
        isPartialSelection: false,
    });
    const [refreshToken, setRefreshToken] = useState(0);

    const chartRef = useRef<HTMLDivElement>(null);
    const embeddedChartRef = useRef<Result | null>(null);
    const debounceTimerRef = useRef<number | null>(null);
    const requestIdRef = useRef(0);

    const clearRenderedChart = useCallback(() => {
        if (embeddedChartRef.current) {
            try {
                embeddedChartRef.current.finalize();
            } catch (error) {
                debugWarn('Failed to finalize ExplainData chart', error);
            } finally {
                embeddedChartRef.current = null;
            }
        }

        if (chartRef.current) {
            chartRef.current.innerHTML = '';
        }
    }, []);

    const vegaConfig = useMemo<VegaGlobalConfig>(() => {
        const nextConfig: VegaGlobalConfig = {
            ...builtInThemes[themeKey ?? 'vega']?.[dark],
        };
        return nextConfig;
    }, [themeKey, dark]);

    const selectionSignature = useMemo(() => {
        return viewDimensions
            .map((field) => {
                const value = resolveSelectionValue(field, selectedMarkObject);
                return `${field.fid}:${String(value ?? '')}`;
            })
            .join('|');
    }, [viewDimensions, selectedMarkObject]);

    const retryExplain = useCallback(() => {
        setRefreshToken((value) => value + 1);
    }, []);

    useEffect(() => {
        if (!showInsightBoard) {
            setStatus('idle');
            setStatusMessage('');
            setExplainDataInfoList([]);
            setSelectionContext({
                matchedDimensions: 0,
                totalDimensions: viewDimensions.length,
                isPartialSelection: false,
            });
            setSelectedInfoIndex(0);
            clearRenderedChart();
            return;
        }

        const predicates = buildExplainPredicates(viewDimensions, selectedMarkObject);
        const context = buildSelectionContext(viewDimensions, predicates);
        setSelectionContext(context);

        if (debounceTimerRef.current !== null) {
            window.clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        requestIdRef.current += 1;
        const requestId = requestIdRef.current;

        if (predicates.length === 0) {
            setExplainDataInfoList([]);
            setStatus('empty');
            setStatusMessage(EMPTY_SELECTION_MESSAGE);
            setSelectedInfoIndex(0);
            return;
        }

        setStatus('loading');
        setStatusMessage('');

        debounceTimerRef.current = window.setTimeout(() => {
            void explainBySelection({
                predicates,
                viewFilters,
                allFields,
                viewMeasures,
                viewDimensions,
                computationFunction,
                timezoneDisplayOffset,
            })
                .then((explainInfoList) => {
                    if (requestId !== requestIdRef.current) {
                        return;
                    }

                    setSelectedInfoIndex(0);
                    setExplainDataInfoList(explainInfoList);

                    if (explainInfoList.length === 0) {
                        setStatus('empty');
                        setStatusMessage(EMPTY_RESULT_MESSAGE);
                        return;
                    }

                    setStatus('ready');
                })
                .catch((error) => {
                    if (requestId !== requestIdRef.current) {
                        return;
                    }

                    console.error('ExplainData query failed', error);
                    setExplainDataInfoList([]);
                    setStatus('error');
                    setStatusMessage(ERROR_MESSAGE);
                });
        }, 120);

        return () => {
            if (debounceTimerRef.current !== null) {
                window.clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        };
    }, [
        showInsightBoard,
        selectionSignature,
        refreshToken,
        viewFilters,
        allFields,
        viewMeasures,
        viewDimensions,
        computationFunction,
        timezoneDisplayOffset,
        selectedMarkObject,
        clearRenderedChart,
    ]);

    useEffect(() => {
        if (selectedInfoIndex >= explainDataInfoList.length) {
            setSelectedInfoIndex(0);
        }
    }, [selectedInfoIndex, explainDataInfoList.length]);

    useEffect(() => {
        if (status !== 'ready' || !chartRef.current) {
            clearRenderedChart();
            return;
        }

        const selectedInfo = explainDataInfoList[selectedInfoIndex];
        if (!selectedInfo) {
            setStatus('empty');
            setStatusMessage(EMPTY_RESULT_MESSAGE);
            return;
        }

        const { normalizedData, normalizedParentData, targetField, measureField, measureKey } = selectedInfo;

        // Vega warns about infinite extents when a layer has only non-finite values.
        // Keep only rows with finite measures and require both layers to be renderable.
        const childRows = normalizedData.filter((row) => isFiniteNumber(row[measureKey]));
        const parentRows = normalizedParentData.filter((row) => isFiniteNumber(row[measureKey]));
        if (childRows.length === 0 || parentRows.length === 0) {
            setStatus('empty');
            setStatusMessage(INVALID_RENDER_DATA_MESSAGE);
            clearRenderedChart();
            return;
        }

        const data = [
            ...childRows.map((row) => ({
                ...row,
                [EXPLAIN_CATEGORY_FIELD]: getCategoryName(row, targetField),
                [EXPLAIN_SCOPE_FIELD]: 'child',
            })),
            ...parentRows.map((row) => ({
                ...row,
                [EXPLAIN_CATEGORY_FIELD]: getCategoryName(row, targetField),
                [EXPLAIN_SCOPE_FIELD]: 'parent',
            })),
        ];

        const { semanticType: targetType, name: targetName } = targetField;
        const xField = {
            x: {
                field: EXPLAIN_CATEGORY_FIELD,
                type: targetType === 'quantitative' ? 'ordinal' : targetType,
                axis: {
                    title: `Distribution of Values for ${targetName}`,
                },
            },
        };

        const spec: TopLevelSpec = {
            data: {
                values: data,
            },
            width: 320,
            height: 200,
            encoding: {
                ...xField,
                color: {
                    legend: {
                        orient: 'bottom',
                    },
                },
            },
            layer: [
                {
                    mark: {
                        type: 'bar',
                        width: 15,
                        opacity: 0.7,
                    },
                    encoding: {
                        y: {
                            field: measureKey,
                            type: 'quantitative',
                            title: `${measureField.aggName} ${measureField.name} for All Marks`,
                        },
                        color: { datum: 'All Marks' },
                    },
                    transform: [{ filter: `datum.${EXPLAIN_SCOPE_FIELD} === 'parent'` }],
                },
                {
                    mark: {
                        type: 'bar',
                        width: 10,
                        opacity: 0.7,
                    },
                    encoding: {
                        y: {
                            field: measureKey,
                            type: 'quantitative',
                            title: `${measureField.aggName} ${measureField.name} for Selected Mark`,
                        },
                        color: { datum: 'Selected Mark' },
                    },
                    transform: [{ filter: `datum.${EXPLAIN_SCOPE_FIELD} === 'child'` }],
                },
            ],
            resolve: { scale: { y: 'independent' } },
        };

        clearRenderedChart();

        let isDisposed = false;
        void embed(chartRef.current, spec, {
            mode: 'vega-lite',
            actions: false,
            config: vegaConfig,
            tooltip: {
                theme: dark,
            },
        })
            .then((result) => {
                if (isDisposed) {
                    result.finalize();
                    return;
                }
                embeddedChartRef.current = result;
            })
            .catch((error) => {
                if (isDisposed) {
                    return;
                }
                console.error('Failed to render ExplainData chart', error);
                setStatus('error');
                setStatusMessage(ERROR_MESSAGE);
            });

        return () => {
            isDisposed = true;
            clearRenderedChart();
        };
    }, [status, explainDataInfoList, selectedInfoIndex, vegaConfig, dark, clearRenderedChart]);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current !== null) {
                window.clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
            requestIdRef.current += 1;
            clearRenderedChart();
        };
    }, [clearRenderedChart]);

    return (
        <Dialog
            open={showInsightBoard}
            onOpenChange={() => {
                vizStore.setShowInsightBoard(false);
                setSelectedInfoIndex(0);
            }}
        >
            <DialogContent data-testid="explain-data-dialog">
                <DialogHeader>
                    <DialogTitle>Explain Data</DialogTitle>
                    <DialogDescription>
                        Explore data insights and explanations for the selected mark.
                    </DialogDescription>
                </DialogHeader>

                {selectionContext.isPartialSelection && (
                    <div className="text-xs text-muted-foreground px-1">
                        Partial selection context: matched {selectionContext.matchedDimensions} of {selectionContext.totalDimensions} dimensions.
                    </div>
                )}

                {status === 'loading' && <LoadingLayer />}

                {(status === 'empty' || status === 'error') && (
                    <div className="p-4 border rounded-md text-sm flex flex-col gap-3" data-testid="explain-data-empty-state">
                        <div>{statusMessage}</div>
                        <div>
                            <Button variant="outline" onClick={retryExplain}>
                                Retry
                            </Button>
                        </div>
                    </div>
                )}

                {status === 'ready' && (
                    <Container className="grid grid-cols-4">
                        <TabsList className="col-span-1">
                            {explainDataInfoList.map((option, i) => {
                                return (
                                    <Tab key={i} className={`${selectedInfoIndex === i ? 'border-primary' : ''} text-xs`} onClick={() => setSelectedInfoIndex(i)}>
                                        {option.targetField.name} {option.score.toFixed(2)}
                                    </Tab>
                                );
                            })}
                        </TabsList>
                        <div className="col-span-3 text-center overflow-y-scroll">
                            <div ref={chartRef}></div>
                        </div>
                    </Container>
                )}
            </DialogContent>
        </Dialog>
    );
});

export default ExplainData;
