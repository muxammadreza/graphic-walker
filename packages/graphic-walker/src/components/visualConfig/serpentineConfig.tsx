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

    // Sync local state when store changes (e.g., on load or external update)
    React.useEffect(() => {
        setLocalConfig(currentConfig);
    }, [serpentine]);

    // Debounced persistence to store
    const persistTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const persistToStore = React.useCallback(
        (config: ISerpentineConfig) => {
            if (persistTimeoutRef.current) {
                clearTimeout(persistTimeoutRef.current);
            }
            persistTimeoutRef.current = setTimeout(() => {
                vizStore.setVisualConfig('serpentine', config);
            }, 500);
        },
        [vizStore],
    );

    // Handle value change: update local state, Vega signal, and debounce persist
    const handleChange = (key: keyof ISerpentineConfig, value: any) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig); // Update UI immediately
        serpentineViewService.updateSignal(key, value); // Update Vega immediately
        persistToStore(newConfig); // Debounced persist to store
    };

    return (
        <div className="flex flex-col gap-4 p-2">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label>Straight Width ({localConfig.width})</Label>
                    <Slider value={[localConfig.width]} max={2000} step={1} onValueChange={(v) => handleChange('width', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Arc Diameter ({localConfig.sH})</Label>
                    <Slider value={[localConfig.sH]} min={25} max={400} step={1} onValueChange={(v) => handleChange('sH', v[0])} />
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox checked={localConfig.labelsOnHover} onCheckedChange={(v) => handleChange('labelsOnHover', v)} />
                    <Label>Hover Labels</Label>
                </div>

                <div className="grid gap-2">
                    <Label># of Arcs ({localConfig.sN})</Label>
                    <Slider value={[localConfig.sN]} max={20} step={0.01} onValueChange={(v) => handleChange('sN', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Tick Count ({localConfig.tC})</Label>
                    <Slider value={[localConfig.tC]} max={100} step={1} onValueChange={(v) => handleChange('tC', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Milestone Offset ({localConfig.mO})</Label>
                    <Slider value={[localConfig.mO]} max={50} step={0.5} onValueChange={(v) => handleChange('mO', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Timeline x0 % ({localConfig.sR0P})</Label>
                    <Slider value={[localConfig.sR0P]} max={1} step={0.01} onValueChange={(v) => handleChange('sR0P', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Timeline Len % ({localConfig.sLP})</Label>
                    <Slider value={[localConfig.sLP]} max={1} step={0.01} onValueChange={(v) => handleChange('sLP', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Start Annotation</Label>
                    <Input value={localConfig.annotationStart} onChange={(e) => handleChange('annotationStart', e.target.value)} />
                </div>

                <div className="grid gap-2">
                    <Label>End Annotation</Label>
                    <Input value={localConfig.annotationEnd} onChange={(e) => handleChange('annotationEnd', e.target.value)} />
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox checked={localConfig.includeArrows} onCheckedChange={(v) => handleChange('includeArrows', v)} />
                    <Label>Include Arrows</Label>
                </div>

                <div className="grid gap-2">
                    <Label>Line Thickness ({localConfig.sT})</Label>
                    <Slider value={[localConfig.sT]} min={1} max={10} step={0.5} onValueChange={(v) => handleChange('sT', v[0])} />
                </div>
            </div>
        </div>
    );
};

export default observer(SerpentineConfig);
