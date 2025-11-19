import React from 'react';
import { observer } from 'mobx-react-lite';
import { useVizStore } from '../../store';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ISerpentineConfig } from '../../interfaces';

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

    const updateConfig = (key: keyof ISerpentineConfig, value: any) => {
        vizStore.setVisualConfig('serpentine', {
            ...currentConfig,
            [key]: value,
        });
    };

    return (
        <div className="flex flex-col gap-4 p-2">
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label>Straight Width ({currentConfig.width})</Label>
                    <Slider value={[currentConfig.width]} max={2000} step={1} onValueChange={(v) => updateConfig('width', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Arc Diameter ({currentConfig.sH})</Label>
                    <Slider value={[currentConfig.sH]} min={25} max={400} step={1} onValueChange={(v) => updateConfig('sH', v[0])} />
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox checked={currentConfig.labelsOnHover} onCheckedChange={(v) => updateConfig('labelsOnHover', v)} />
                    <Label>Hover Labels</Label>
                </div>

                <div className="grid gap-2">
                    <Label># of Arcs ({currentConfig.sN})</Label>
                    <Slider value={[currentConfig.sN]} max={20} step={0.01} onValueChange={(v) => updateConfig('sN', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Tick Count ({currentConfig.tC})</Label>
                    <Slider value={[currentConfig.tC]} max={100} step={1} onValueChange={(v) => updateConfig('tC', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Milestone Offset ({currentConfig.mO})</Label>
                    <Slider value={[currentConfig.mO]} max={50} step={0.5} onValueChange={(v) => updateConfig('mO', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Timeline x0 % ({currentConfig.sR0P})</Label>
                    <Slider value={[currentConfig.sR0P]} max={1} step={0.01} onValueChange={(v) => updateConfig('sR0P', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Timeline Len % ({currentConfig.sLP})</Label>
                    <Slider value={[currentConfig.sLP]} max={1} step={0.01} onValueChange={(v) => updateConfig('sLP', v[0])} />
                </div>

                <div className="grid gap-2">
                    <Label>Start Annotation</Label>
                    <Input value={currentConfig.annotationStart} onChange={(e) => updateConfig('annotationStart', e.target.value)} />
                </div>

                <div className="grid gap-2">
                    <Label>End Annotation</Label>
                    <Input value={currentConfig.annotationEnd} onChange={(e) => updateConfig('annotationEnd', e.target.value)} />
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox checked={currentConfig.includeArrows} onCheckedChange={(v) => updateConfig('includeArrows', v)} />
                    <Label>Include Arrows</Label>
                </div>

                <div className="grid gap-2">
                    <Label>Line Thickness ({currentConfig.sT})</Label>
                    <Slider value={[currentConfig.sT]} min={1} max={10} step={0.5} onValueChange={(v) => updateConfig('sT', v[0])} />
                </div>
            </div>
        </div>
    );
};

export default observer(SerpentineConfig);
