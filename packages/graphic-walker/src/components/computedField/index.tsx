import { observer } from 'mobx-react-lite';
import React, { useState, useMemo, useEffect } from 'react';
import { useVizStore } from '../../store';
import { isNotEmpty, parseErrorMessage } from '../../utils';
import { highlightField } from '../highlightField';
import { unstable_batchedUpdates } from 'react-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const ComputedFieldDialog: React.FC = observer(() => {
    const vizStore = useVizStore();
    const { editingComputedFieldFid } = vizStore;
    const [name, setName] = useState<string>('');
    const [sql, setSql] = useState<string>('');
    const [error, setError] = useState<string>('');

    const SQLField = useMemo(() => {
        return highlightField((value: string) => value);
    }, []);

    useEffect(() => {
        if (isNotEmpty(editingComputedFieldFid)) {
            if (editingComputedFieldFid === '') {
                let idx = 1;
                while (vizStore.allFields.find((x) => x.name === `Computed ${idx}`)) {
                    idx++;
                }
                unstable_batchedUpdates(() => {
                    setName(`Computed ${idx}`);
                    setSql('');
                    setError('');
                });
            } else {
                const f = vizStore.allFields.find((x) => x.fid === editingComputedFieldFid);
                if (!f || !f.computed || f.expression?.op !== 'expr') {
                    vizStore.setComputedFieldFid('');
                    return;
                }
                const sql = f.expression.params.find((x) => x.type === 'sql');
                if (!sql) {
                    vizStore.setComputedFieldFid('');
                    return;
                }
                unstable_batchedUpdates(() => {
                    setName(f.name);
                    setSql(sql.value);
                    setError('');
                });
            }
        }
    }, [editingComputedFieldFid, vizStore]);

    if (!isNotEmpty(editingComputedFieldFid)) return null;

    return (
        <Dialog
            open={true}
            onOpenChange={() => {
                vizStore.setComputedFieldFid();
            }}
        >
            <DialogContent data-testid="computed-field-dialog">
                <DialogHeader>
                    <DialogTitle>{editingComputedFieldFid === '' ? 'Add Computed Field' : 'Edit Computed Field'}</DialogTitle>
                    <DialogDescription>
                        Computed fields guide:{' '}
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-primary"
                            href="https://github.com/Kanaries/graphic-walker/wiki/How-to-Create-Computed-field-in-Graphic-Walker"
                        >
                            read here
                        </a>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col space-y-2">
                    <div className="flex flex-col space-y-2">
                        <label className="text-ml whitespace-nowrap">Name</label>
                        <Input
                            type="text"
                            value={name}
                            placeholder="Enter Field Name..."
                            onChange={(e) => {
                                setName(e.target.value);
                            }}
                        />
                        <label className="text-ml whitespace-nowrap">SQL</label>
                            <SQLField value={sql} onChange={setSql} placeholder="Enter SQL..." />
                    </div>
                    {error && <div className="text-xs text-red-500">{error}</div>}
                    <div className="flex justify-end space-x-2">
                        <Button
                            disabled={!sql || !name}
                            children={editingComputedFieldFid === '' ? 'Add' : 'Edit'}
                            onClick={() => {
                                try {
                                    vizStore.upsertComputedField(editingComputedFieldFid!, name, sql);
                                    vizStore.setComputedFieldFid();
                                } catch (e) {
                                    setError(parseErrorMessage(e));
                                }
                            }}
                        ></Button>
                        <Button variant="outline" children="Cancel" onClick={() => vizStore.setComputedFieldFid()}></Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});

export default ComputedFieldDialog;
