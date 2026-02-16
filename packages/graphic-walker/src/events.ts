import type { IChart, IVisualConfigNew } from './interfaces';

export const GW_EDIT_EVENT = 'edit-graphic-walker' as const;
export const GW_VISUAL_CONFIG_CHANGED_EVENT = 'visual-config-changed' as const;

export interface GWEditEventDetail {
    spec: IChart;
    instanceID: string;
}

export interface GWVisualConfigChangedEventDetail {
    configKey: keyof IVisualConfigNew;
    configValue: IVisualConfigNew[keyof IVisualConfigNew];
    spec: IChart;
    instanceID: string;
}
