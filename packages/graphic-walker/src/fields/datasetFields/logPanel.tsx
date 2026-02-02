import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVizStore } from '../../store';
import { ICreateField } from '../../interfaces';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FieldScalePanel: React.FC = (props) => {
    const vizStore = useVizStore();
    const { showLogSettingPanel } = vizStore;
    const [baseNum, setBaseNum] = useState<string>('');
    const { t } = useTranslation();
    useEffect(() => {
        setBaseNum('');
    }, [showLogSettingPanel]);
    return (
        <Dialog
            open={showLogSettingPanel}
            onOpenChange={() => {
                vizStore.setShowLogSettingPanel(false);
            }}
        >
            <DialogContent className="!w-fit" data-testid="log-panel-dialog" aria-describedby="log-panel-description">
                <DialogHeader>
                    <DialogTitle>{t(`calc.log_panel_title`)}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col justify-center items-start text-xs ">
                    <p id="log-panel-description" className="font-normal text-muted-foreground">
                        {t(`calc.log_panel_desc`)}
                    </p>
                    <fieldset className="mt-2 gap-1 flex flex-col justify-center items-start">
                        <div className="flex items-center space-x-2">
                            <label className="text-ml whitespace-nowrap">{t(`calc.log_panel_number`)}</label>
                            <Input
                                type="text"
                                value={baseNum}
                                onChange={(e) => {
                                    setBaseNum(e.target.value);
                                }}
                            />
                        </div>
                    </fieldset>
                </div>
                <DialogFooter className="mt-2">
                    <Button
                        children={t('actions.confirm')}
                        onClick={() => {
                            const field = vizStore.createField as ICreateField;
                            vizStore.createLogField(field.channel, field.index, 'log', Number(baseNum));
                            vizStore.setShowLogSettingPanel(false);
                        }}
                    />
                    <Button
                        variant="outline"
                        children={t('actions.cancel')}
                        onClick={() => {
                            vizStore.setShowLogSettingPanel(false);
                        }}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
export default observer(FieldScalePanel);
