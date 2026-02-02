import React from 'react';
import CSVData from './csvData';
import PublicData from './publicData';
import { useTranslation } from 'react-i18next';
import { CommonStore } from '../../store/commonStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DataSelection: React.FC<{ commonStore: CommonStore }> = (props) => {
    const { commonStore } = props;
    const { t } = useTranslation('translation', { keyPrefix: 'DataSource' });

    return (
        <div className="text-sm">
            <div className="mt-4">
                <Tabs defaultValue="file" data-testid="data-source-tabs">
                    <TabsList aria-label="Data source selection">
                        <TabsTrigger value="file" data-testid="data-source-tab-file">
                            {t('dialog.text_file_data')}
                        </TabsTrigger>
                        <TabsTrigger value="public" data-testid="data-source-tab-public">
                            {t('dialog.public_data')}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="file" data-testid="data-source-content-file">
                        <CSVData commonStore={commonStore} />
                    </TabsContent>
                    <TabsContent value="public" data-testid="data-source-content-public">
                        <PublicData commonStore={commonStore} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default DataSelection;
