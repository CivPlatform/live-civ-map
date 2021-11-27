import useLocalStorage from '@rehooks/local-storage'

const DEFAULT_LAYER_URL =
	process.env.REACT_APP_DEFAULT_LAYER_URL || 'ws://localhost:5000/dev'

/** stored to remember known layers in the client's map */
export type Layer = { url: string; hidden?: boolean }

export function useLayers(): [Layer[], (newValue: Layer[]) => void] {
	let [layers, setLayers] = useLocalStorage<Layer[]>('LiveCivMap:layers')
	if (!layers) layers = [{ url: DEFAULT_LAYER_URL }]
	return [layers, setLayers]
}
