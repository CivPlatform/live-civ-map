// import { Bounds, XZ } from './spatial'

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
