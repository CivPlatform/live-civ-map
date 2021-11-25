import useLocalStorage from '@rehooks/local-storage'
import { useMemo } from 'react'
import { selector } from 'recoil'
import { getLoginStatus, tokenLSKey } from './DiscordLogin'
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

export const features = selector<Feature[]>({
	key: 'features',
	get: async ({ get }) => {
		return [{ id: 'TODO', geometry: { x: 0, z: 0 } }]
	},
})

export interface DiscordUser {
	id: string
	username: string
	discriminator: string
	avatar?: string
}

export function useLoginStatus() {
	const [text] = useLocalStorage(tokenLSKey)
	// don't actually parse the contents, just listen for its changes
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo(() => getLoginStatus(), [text])
}
