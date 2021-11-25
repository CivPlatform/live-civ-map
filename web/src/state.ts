// import { Bounds, XZ } from './map/spatial'

export type FeatureGeometry = { x: number; z: number }
// | { x: number; z: number; radius: number }
// | { x: number; z: number; rect_size: number }
// | { rectangle: Bounds }
// | { lines: XZ[][] }
// | { polygons: XZ[][] }
// | { map_image: { url: string; bounds: Bounds } }

export interface Feature {
	/** internal only */
	id: string
	geometry: FeatureGeometry
}

export function setAuthToken(token: string) {
	console.log({ token }) // XXX
}

export function setAuthError(error: string) {
	console.error({ error }) // XXX
}

export function setFeature(feature: Feature) {
	console.log({ feature }) // XXX
}
