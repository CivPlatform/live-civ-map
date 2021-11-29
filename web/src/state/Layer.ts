import useLocalStorage from '@rehooks/local-storage'
import { useCallback } from 'react'

const DEFAULT_LAYER_URL =
	process.env.REACT_APP_DEFAULT_LAYER_URL || 'ws://localhost:5000/dev'

/** stored to remember known layers in the client's map */
export type LayerConfig = { url: string; hidden?: boolean; alias?: string }

// TODO use recoil for less updates

export function useLayerConfigs(): [
	LayerConfig[],
	(newValue: LayerConfig[]) => void
] {
	let [layerConfigs, setLayerConfigs] =
		useLocalStorage<LayerConfig[]>('LiveCivMap:layers')
	if (!layerConfigs) layerConfigs = [{ url: DEFAULT_LAYER_URL, alias: 'DEMO' }]
	return [layerConfigs, setLayerConfigs]
}

export function useLayerConfig(
	layerUrl: string
): [LayerConfig, (newValue: LayerConfig | null) => void] {
	const [layerConfigs, setLayerConfigs] = useLayerConfigs()

	const layerConfig = layerConfigs.find((l) => l.url === layerUrl) || {
		url: layerUrl,
	}

	const setLayerConfig = useCallback(
		(newLayerConfig: LayerConfig | null) => {
			// if null, delete; otherwise, update
			const newLayerConfigs = layerConfigs.filter((l) => l.url !== layerUrl)
			if (newLayerConfig) newLayerConfigs.push(newLayerConfig)
			setLayerConfigs(newLayerConfigs)
		},
		[layerUrl, layerConfigs, setLayerConfigs]
	)

	return [layerConfig, setLayerConfig]
}
