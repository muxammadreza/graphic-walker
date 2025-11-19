import React, { useState } from 'react';
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

const DatasetFields: React.FC = (props) => {
    const { t } = useTranslation('translation', { keyPrefix: 'main.tabpanel.DatasetFields' });
    const vizStore = useVizStore();
    const { config } = vizStore;
    const { geoms } = config;

    const [isFieldListOpen, setIsFieldListOpen] = useState(true);
    const [isConfigOpen, setIsConfigOpen] = useState(true);

    return (
        <div className="p-1 sm:mr-0.5 my-0.5 border flex sm:flex-col sm:h-full overflow-y-auto" style={{ paddingBlock: 0, paddingInline: '0.6em' }}>
            <Collapsible open={isFieldListOpen} onOpenChange={setIsFieldListOpen} className="w-full">
                <CollapsibleTrigger className="flex items-center w-full cursor-pointer select-none mt-2 mb-2">
                    {isFieldListOpen ? <ChevronDownIcon className="mr-1" /> : <ChevronRightIcon className="mr-1" />}
                    <h4 className="text-xs font-bold">{t('field_list')}</h4>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <Droppable droppableId="dimensions" direction="vertical">
                        {(provided, snapshot) => (
                            <div
                                className="flex-shrink min-w-[0px] min-h-[100px] sm:max-h-[380px] sm:overflow-y-auto"
                                {...provided.droppableProps}
                                ref={refMapper(provided.innerRef)}
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
                                className="flex-shrink flex-grow min-w-[0px] min-h-[200px] sm:overflow-y-auto flex-1"
                                {...provided.droppableProps}
                                ref={refMapper(provided.innerRef)}
                            >
                                <div className="border-t flex-grow pd-1 overflow-y-auto h-full">
                                    <MeaFields />
                                </div>
                            </div>
                        )}
                    </Droppable>
                </CollapsibleContent>
            </Collapsible>

            {geoms[0] === 'serpentine' && (
                <Collapsible open={isConfigOpen} onOpenChange={setIsConfigOpen} className="w-full mt-4 border-t pt-2">
                    <CollapsibleTrigger className="flex items-center w-full cursor-pointer select-none mb-2">
                        {isConfigOpen ? <ChevronDownIcon className="mr-1" /> : <ChevronRightIcon className="mr-1" />}
                        <h4 className="text-xs font-bold">Serpentine Chart Configurations</h4>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="max-h-[400px] overflow-y-auto pr-2">
                        <SerpentineConfig />
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    );
};

export default observer(DatasetFields);
