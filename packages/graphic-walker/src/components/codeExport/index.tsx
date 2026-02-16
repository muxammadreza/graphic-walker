import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useVizStore } from '../../store';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { toVegaSimplifiedWithAggergation } from '@/models/chat';
import { syntaxHighlightSegments } from '@/utils/syntaxHighlight';

const CodeExport: React.FC = observer((props) => {
    const vizStore = useVizStore();
    const { showCodeExportPanel } = vizStore;
    const { t } = useTranslation();
    const [tabKey, setTabKey] = useState<string>('graphic-walker');
    const [code, setCode] = useState('');

    const specTabs: { key: string; label: string }[] = [
        {
            key: 'graphic-walker',
            label: 'Graphic-Walker',
        },
        {
            key: 'vega-lite',
            label: 'Vega-Lite',
        },
        ...(vizStore.layout.showActions
            ? [
                  {
                      key: 'workflow',
                      label: 'Workflow',
                  },
              ]
            : []),
    ];

    useEffect(() => {
        if (showCodeExportPanel) {
            if (tabKey === 'graphic-walker') {
                const res = vizStore.exportCode();
                setCode(JSON.stringify(res, null, 4));
            } else if (tabKey === 'vega-lite') {
                setCode(JSON.stringify(vizStore.exportCode().map(toVegaSimplifiedWithAggergation), null, 4));
            } else if (tabKey === 'workflow') {
                const workflow = vizStore.workflow;
                setCode(JSON.stringify(workflow, null, 4));
            } else {
                console.error('unknown tabKey');
            }
        }
    }, [tabKey, showCodeExportPanel, vizStore]);
    return (
        <Dialog
            open={showCodeExportPanel}
            onOpenChange={() => {
                vizStore.setShowCodeExportPanel(false);
            }}
        >
            <DialogContent data-testid="code-export-dialog">
                <DialogHeader>
                    <DialogTitle>Code Export</DialogTitle>
                    <DialogDescription>Export and copy the visualization code in different formats.</DialogDescription>
                </DialogHeader>
                <Tabs value={tabKey} onValueChange={setTabKey}>
                    <TabsList className="my-1">
                        {specTabs.map((tab) => (
                            <TabsTrigger key={tab.key} value={tab.key}>
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="border rounded-md overflow-hidden">
                        <pre className="text-sm px-6 py-3 max-h-96 overflow-auto whitespace-pre-wrap break-all" data-testid="code-export-content">
                            {syntaxHighlightSegments(code).map((segment, index) => (
                                <span key={index} className={segment.className}>
                                    {segment.text}
                                </span>
                            ))}
                        </pre>
                    </div>
                </Tabs>
                <DialogFooter className="mt-2">
                    <Button
                        children="Copy to Clipboard"
                        onClick={() => {
                            navigator.clipboard.writeText(code);
                            vizStore.setShowCodeExportPanel(false);
                        }}
                    />
                    <Button
                        variant="outline"
                        children={t('actions.cancel')}
                        onClick={() => {
                            vizStore.setShowCodeExportPanel(false);
                        }}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

export default CodeExport;
