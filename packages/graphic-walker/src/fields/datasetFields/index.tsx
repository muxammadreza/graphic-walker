import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Droppable } from '@kanaries/react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import { ChevronRightIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import DimFields from './dimFields';
import MeaFields from './meaFields';
import { refMapper } from '../fieldsContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';
import SerpentineConfig from '../../components/visualConfig/serpentineConfig';
import { useVizStore } from '../../store';

const STORAGE_KEY = 'gw-field-list-height-px';
const MIN_FIELD_LIST_HEIGHT = 250; // pixels

const DatasetFields: React.FC = (props) => {
    const { t } = useTranslation('translation', { keyPrefix: 'main.tabpanel.DatasetFields' });
    const vizStore = useVizStore();
    const { config } = vizStore;
    const { geoms } = config;

    const [isFieldListOpen, setIsFieldListOpen] = useState(true);
    const [isConfigOpen, setIsConfigOpen] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);

    // Store height in pixels for precise control
    const [fieldListHeightPx, setFieldListHeightPx] = useState<number>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? parseInt(stored, 10) : MIN_FIELD_LIST_HEIGHT;
    });

    // Calculate percentage based on container height
    const [fieldListHeightPercent, setFieldListHeightPercent] = useState(50);

    // Update percentage when container size changes
    useEffect(() => {
        const updatePercentage = () => {
            if (containerRef.current) {
                const containerHeight = containerRef.current.getBoundingClientRect().height;
                if (containerHeight > 0) {
                    const percent = (fieldListHeightPx / containerHeight) * 100;
                    setFieldListHeightPercent(Math.max(20, Math.min(80, percent)));
                }
            }
        };

        updatePercentage();
        window.addEventListener('resize', updatePercentage);
        return () => window.removeEventListener('resize', updatePercentage);
    }, [fieldListHeightPx]);

    const handleMouseDown = useCallback(() => {
        setIsResizing(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (isResizing && containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const newHeightPx = e.clientY - containerRect.top;

                // Enforce minimum height
                const constrainedHeight = Math.max(MIN_FIELD_LIST_HEIGHT, newHeightPx);
                const maxHeight = containerRect.height * 0.8; // Max 80% of container
                const finalHeight = Math.min(constrainedHeight, maxHeight);

                setFieldListHeightPx(finalHeight);

                // Persist to localStorage
                localStorage.setItem(STORAGE_KEY, finalHeight.toString());
            }
        },
        [isResizing],
    );

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={containerRef}
            className="p-1 sm:mr-0.5 my-0.5 border flex sm:flex-col sm:h-full"
            style={{ paddingBlock: 0, paddingInline: '0.6em', overflow: 'hidden' }}
        >
            <Collapsible
                open={isFieldListOpen}
                onOpenChange={setIsFieldListOpen}
                data-testid="field-list-container"
                className="w-full flex flex-col"
                style={{ height: geoms[0] === 'serpentine' ? `${fieldListHeightPercent}%` : '100%', minHeight: 0 }}
            >
                <CollapsibleTrigger
                    className="flex items-center w-full cursor-pointer select-none mt-2 mb-2"
                    aria-label={isFieldListOpen ? 'Collapse field list' : 'Expand field list'}
                    data-testid="field-list-toggle"
                >
                    {isFieldListOpen ? <ChevronDownIcon className="mr-1" /> : <ChevronRightIcon className="mr-1" />}
                    <h4 className="text-xs font-bold">{t('field_list')}</h4>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex-1 flex flex-col min-h-0 overflow-hidden gw-scrollbar">
                    <Droppable droppableId="dimensions" direction="vertical">
                        {(provided, snapshot) => (
                            <div
                                className="flex-shrink min-w-[0px] min-h-[100px] overflow-y-auto gw-scrollbar"
                                {...provided.droppableProps}
                                ref={refMapper(provided.innerRef)}
                                role="region"
                                aria-label="Dimension fields"
                                data-testid="dimensions-droppable"
                            >
                                <div className="pd-1">
                                    <DimFields />
                                </div>
                            </div>
                        )}
                    </Droppable>
                    <Droppable droppableId="measures" direction="vertical">
                        {(provided, snapshot) => (
                            <div
                                className="flex-shrink flex-grow min-w-[0px] min-h-[100px] overflow-y-auto flex-1 gw-scrollbar"
                                {...provided.droppableProps}
                                ref={refMapper(provided.innerRef)}
                                role="region"
                                aria-label="Measure fields"
                                data-testid="measures-droppable"
                            >
                                <div className="border-t flex-grow pd-1 overflow-y-auto h-full gw-scrollbar">
                                    <MeaFields />
                                </div>
                            </div>
                        )}
                    </Droppable>
                </CollapsibleContent>
            </Collapsible>

            {geoms[0] === 'serpentine' && (
                <>
                    <div
                        className="w-full h-[6px] cursor-ns-resize hover:bg-gray-300 active:bg-gray-400 flex items-center justify-center relative group"
                        onMouseDown={handleMouseDown}
                        style={{ userSelect: 'none' }}
                        role="separator"
                        aria-orientation="horizontal"
                        aria-label="Resize field list and configuration panels"
                        aria-valuenow={fieldListHeightPercent}
                        aria-valuemin={20}
                        aria-valuemax={80}
                        tabIndex={0}
                        data-testid="field-list-resize-handle"
                    >
                        <div className="w-12 h-[2px] bg-gray-400 rounded-full group-hover:bg-gray-500"></div>
                    </div>
                    <Collapsible
                        open={isConfigOpen}
                        onOpenChange={setIsConfigOpen}
                        className="w-full flex flex-col"
                        style={{ height: `${100 - fieldListHeightPercent}%`, minHeight: 0 }}
                    >
                        <CollapsibleTrigger
                            className="flex items-center w-full cursor-pointer select-none mb-2 mt-1"
                            aria-label={isConfigOpen ? 'Collapse configuration' : 'Expand configuration'}
                            data-testid="serpentine-config-toggle"
                        >
                            {isConfigOpen ? <ChevronDownIcon className="mr-1" /> : <ChevronRightIcon className="mr-1" />}
                            <h4 className="text-xs font-bold">Serpentine Chart Configurations</h4>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="flex-1 overflow-y-auto pr-2 gw-scrollbar">
                            <SerpentineConfig />
                        </CollapsibleContent>
                    </Collapsible>
                </>
            )}
        </div>
    );
};

export default observer(DatasetFields);
