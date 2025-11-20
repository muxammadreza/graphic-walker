import React from 'react';
import { observer } from 'mobx-react-lite';
import { useVizStore } from '../../store';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ISerpentineConfig } from '../../interfaces';
import { serpentineViewService } from '../../services/serpentineViewService';

const SerpentineConfig: React.FC = () => {
    const vizStore = useVizStore();
    const { config } = vizStore;
    const { serpentine } = config;

    // Default values if config is missing
    const defaults: ISerpentineConfig = {
        width: 800,
        sH: 125,
        labelsOnHover: false,
        sN: 2.2,
        tC: 21,
        mO: 35,
        sR0P: 0,
        sLP: 1,
        annotationStart: '',
        annotationEnd: '',
        includeArrows: true,
        sT: 5,
    };

    const currentConfig = { ...defaults, ...serpentine };

    // Local state for immediate UI feedback during dragging
    const [localConfig, setLocalConfig] = React.useState(currentConfig);

    // Sync local state when store changes (e.g., on initial load)
    React.useEffect(() => {
        setLocalConfig(currentConfig);
    }, [JSON.stringify(currentConfig)]);

    // Handle value change DURING dragging:
    // 1. Update local state immediately (UI feedback)
    // 2. Update Vega signal immediately (chart updates)
    // NO persistence - that happens on release
    const handleChangeWhileDragging = (key: keyof ISerpentineConfig, value: any) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig); // Immediate UI update
        serpentineViewService.updateSignal(key, value); // Immediate Vega update
        // NO persistence call here - this fires continuously while dragging
    };

    // Handle value COMMIT (slider released):
    // Trigger persistence immediately when user releases the handle
    const handleCommit = (key: keyof ISerpentineConfig) => {
        // Direct persistence on slider release - no debounce needed
        // The config already updated via handleChangeWhileDragging
        vizStore.updateVisualConfigDirect('serpentine', localConfig);
    };

    return (
        <div className="flex flex-col gap-4 p-2">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label>Straight Width ({localConfig.width})</Label>
                    <Slider
                        value={[localConfig.width]}
                        max={2000}
                        step={1}
                        onValueChange={(v) => handleChangeWhileDragging('width', v[0])}
                        onValueCommit={() => handleCommit('width')}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Arc Diameter ({localConfig.sH})</Label>
                    <Slider
                        value={[localConfig.sH]}
                        min={25}
                        max={400}
                        step={1}
                        onValueChange={(v) => handleChangeWhileDragging('sH', v[0])}
                        onValueCommit={() => handleCommit('sH')}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="labelsOnHover"
                        checked={localConfig.labelsOnHover}
                        onCheckedChange={(checked) => {
                            const newConfig = { ...localConfig, labelsOnHover: !!checked };
                            setLocalConfig(newConfig);
                            serpentineViewService.updateSignal('labelsOnHover', !!checked);
                            vizStore.updateVisualConfigDirect('serpentine', newConfig);
                        }}
                    />
                    <Label htmlFor="labelsOnHover">Hover Labels</Label>
                </div>

                <div className="grid gap-2">
                    <Label># of Arcs ({localConfig.sN})</Label>
                    <Slider
                        value={[localConfig.sN]}
                        max={20}
                        step={0.01}
                        onValueChange={(v) => handleChangeWhileDragging('sN', v[0])}
                        onValueCommit={() => handleCommit('sN')}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Text Column ({localConfig.tC})</Label>
                    <Slider
                        value={[localConfig.tC]}
                        max={50}
                        step={1}
                        onValueChange={(v) => handleChangeWhileDragging('tC', v[0])}
                        onValueCommit={() => handleCommit('tC')}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Milestone Offset ({localConfig.mO})</Label>
                    <Slider
                        value={[localConfig.mO]}
                        max={50}
                        step={0.5}
                        onValueChange={(v) => handleChangeWhileDragging('mO', v[0])}
                        onValueCommit={() => handleCommit('mO')}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Timeline x0 % ({localConfig.sR0P})</Label>
                    <Slider
                        value={[localConfig.sR0P]}
                        max={1}
                        step={0.01}
                        onValueChange={(v) => handleChangeWhileDragging('sR0P', v[0])}
                        onValueCommit={() => handleCommit('sR0P')}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Timeline Len % ({localConfig.sLP})</Label>
                    <Slider
                        value={[localConfig.sLP]}
                        max={1}
                        step={0.01}
                        onValueChange={(v) => handleChangeWhileDragging('sLP', v[0])}
                        onValueCommit={() => handleCommit('sLP')}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Start Annotation</Label>
                    <Input
                        value={localConfig.annotationStart}
                        onChange={(e) => {
                            const newConfig = { ...localConfig, annotationStart: e.target.value };
                            setLocalConfig(newConfig);
                            serpentineViewService.updateSignal('annotationStart', e.target.value);
                            vizStore.updateVisualConfigDirect('serpentine', newConfig);
                        }}
                    />
                </div>

                <div className="grid gap-2">
                    <Label>End Annotation</Label>
                    <Input
                        value={localConfig.annotationEnd}
                        onChange={(e) => {
                            const newConfig = { ...localConfig, annotationEnd: e.target.value };
                            setLocalConfig(newConfig);
                            serpentineViewService.updateSignal('annotationEnd', e.target.value);
                            vizStore.updateVisualConfigDirect('serpentine', newConfig);
                        }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="includeArrows"
                        checked={localConfig.includeArrows}
                        onCheckedChange={(checked) => {
                            const newConfig = { ...localConfig, includeArrows: !!checked };
                            setLocalConfig(newConfig);
                            serpentineViewService.updateSignal('includeArrows', !!checked);
                            vizStore.updateVisualConfigDirect('serpentine', newConfig);
                        }}
                    />
                    <Label htmlFor="includeArrows">Include Arrows</Label>
                </div>

                <div className="grid gap-2">
                    <Label>Line Thickness ({localConfig.sT})</Label>
                    <Slider
                        value={[localConfig.sT]}
                        min={1}
                        max={10}
                        step={0.5}
                        onValueChange={(v) => handleChangeWhileDragging('sT', v[0])}
                        onValueCommit={() => handleCommit('sT')}
                    />
                </div>
            </div>
        </div>
    );
};

export default observer(SerpentineConfig);
