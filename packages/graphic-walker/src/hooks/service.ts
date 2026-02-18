import { IGeoUrl } from '../interfaces';
import { useState, useEffect } from 'react';
import { feature } from 'topojson-client';
import type { FeatureCollection } from 'geojson';

const GeoJSONDict: Record<string, FeatureCollection> = {};
const GeoJSONPromiseDict: Record<string, Promise<FeatureCollection> | undefined> = {};

function fetchGeoCollection(url: IGeoUrl): Promise<FeatureCollection> {
    return fetch(url.url)
        .then((res) => res.json())
        .then((json) => {
            if (url.type === 'GeoJSON') {
                if ('features' in json) {
                    return json as FeatureCollection;
                }
                throw 'invalid geojson';
            }

            return feature(json, Object.keys(json.objects)[0]) as unknown as FeatureCollection;
        });
}

export function useGeoJSON(geojson?: FeatureCollection, url?: IGeoUrl) {
    const key = url ? `${url.type}(${url.url})` : '';
    const data = (geojson || GeoJSONDict[key] || url) as IGeoUrl | FeatureCollection;
    const [_, setLastFetched] = useState(0);

    useEffect(() => {
        if (data === url && url) {
            let cancelled = false;

            if (!GeoJSONPromiseDict[key]) {
                GeoJSONPromiseDict[key] = fetchGeoCollection(url);
            }

            GeoJSONPromiseDict[key]
                ?.then((collection) => {
                    if (cancelled) {
                        return;
                    }

                    GeoJSONDict[key] = collection;
                    setLastFetched(Date.now());
                })
                .catch((e) => {
                    GeoJSONPromiseDict[key] = undefined;
                    if (!cancelled) {
                        console.error(e);
                    }
                });

            return () => {
                cancelled = true;
            };
        }
    }, [data, key, url]);

    return data === url ? undefined : (data as FeatureCollection);
}
