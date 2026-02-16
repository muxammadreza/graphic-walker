import React from 'react';
import { observer } from 'mobx-react-lite';
import { useVizStore } from '../store';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';

const RemoveConfirm = observer(function RemoveConfirm() {
    const { t } = useTranslation();

    const viz = useVizStore();
    return (
        <Dialog onOpenChange={() => viz.closeRemoveConfirmModal()} open={viz.removeConfirmIdx !== null}>
            <DialogContent data-testid="remove-confirm-dialog">
                <DialogHeader>
                    <DialogTitle>{t('main.tablist.remove_confirm')}</DialogTitle>
                    <DialogDescription>{t('main.tablist.remove_confirm')}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            viz.closeRemoveConfirmModal();
                        }}
                        data-testid="remove-confirm-cancel"
                        aria-label="Cancel removal"
                    >
                        {t('actions.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            viz.removeVisualization(viz.removeConfirmIdx!);
                            viz.closeRemoveConfirmModal();
                        }}
                        data-testid="remove-confirm-delete"
                        aria-label="Confirm removal"
                    >
                        {t('actions.confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

export default RemoveConfirm;
