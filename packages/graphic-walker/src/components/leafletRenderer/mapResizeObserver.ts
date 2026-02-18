import type { Map } from 'leaflet';

export function observeLeafletMapResize(map: Map): () => void {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
        map.invalidateSize();
    });

    observer.observe(container);

    return () => {
        observer.disconnect();
    };
}
