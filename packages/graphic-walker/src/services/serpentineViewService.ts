import type { View } from 'vega';

/**
 * Simple service to manage Vega view references for serpentine charts.
 * This allows SerpentineConfig to update signals directly without triggering MobX reactivity.
 */
class SerpentineViewService {
    private views: Map<string, View> = new Map();

    setView(instanceID: string, view: View | null) {
        if (view) {
            this.views.set(instanceID, view);
            return;
        }
        this.views.delete(instanceID);
    }

    getView(instanceID: string): View | null {
        return this.views.get(instanceID) ?? null;
    }

    updateSignal(instanceID: string, name: string, value: unknown) {
        const view = this.views.get(instanceID);
        if (view) {
            try {
                view.signal(name, value);
                view.runAsync();
            } catch (error) {
                console.warn(`Failed to update serpentine signal ${name}:`, error);
            }
        }
    }

    addSignalListener(instanceID: string, name: string, handler: (name: string, value: unknown) => void) {
        const view = this.views.get(instanceID);
        if (view) {
            view.addSignalListener(name, handler);
        }
    }

    removeSignalListener(instanceID: string, name: string, handler: (name: string, value: unknown) => void) {
        const view = this.views.get(instanceID);
        if (view) {
            view.removeSignalListener(name, handler);
        }
    }
}

export const serpentineViewService = new SerpentineViewService();
