import type { View } from 'vega';

/**
 * Simple service to manage Vega view references for serpentine charts.
 * This allows SerpentineConfig to update signals directly without triggering MobX reactivity.
 */
class SerpentineViewService {
    private view: View | null = null;

    setView(view: View | null) {
        this.view = view;
    }

    getView(): View | null {
        return this.view;
    }

    updateSignal(name: string, value: any) {
        if (this.view) {
            try {
                this.view.signal(name, value);
                this.view.runAsync();
            } catch (error) {
                console.warn(`Failed to update serpentine signal ${name}:`, error);
            }
        }
    }

    addSignalListener(name: string, handler: (name: string, value: any) => void) {
        if (this.view) {
            this.view.addSignalListener(name, handler);
        }
    }

    removeSignalListener(name: string, handler: (name: string, value: any) => void) {
        if (this.view) {
            this.view.removeSignalListener(name, handler);
        }
    }
}

export const serpentineViewService = new SerpentineViewService();
