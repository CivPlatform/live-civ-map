import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Feature } from '../model/Feature'
import { layerSlugFromUrl } from '../pages'

export function FeaturesSelectList(props: {
	features: { layerUrl: string; feature: Feature }[]
	fmtRow: (f: Feature, layerUrl: string) => React.ReactElement
}) {
	const { features, fmtRow } = props
	const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
	return (
		<>
			{features.map(({ layerUrl, feature }) => (
				<div style={{ display: 'flex', flexDirection: 'row' }} key={feature.id}>
					<button
						onClick={() => {
							if (selectedFeatures.includes(feature.id)) {
								setSelectedFeatures((sel) =>
									sel.filter((id) => id !== feature.id)
								)
							} else {
								setSelectedFeatures((sel) => [...sel, feature.id])
							}
						}}
						title="Select"
						style={{ padding: 8 }}
					>
						{selectedFeatures.includes(feature.id) ? '[x]' : '[ ]'}
					</button>
					<Link
						to={`/layer/${layerSlugFromUrl(layerUrl)}/feature/${feature.id}`}
						style={{ padding: 8, paddingLeft: 16, flex: 1 }}
					>
						{fmtRow(feature, layerUrl)}
					</Link>
					<button
						onClick={() => 0 /* TODO */}
						title="Show on map"
						style={{ padding: 8 }}
					>
						:show:
					</button>
				</div>
			))}
			{selectedFeatures.length > 0 && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
					}}
				>
					<span style={{ padding: 8, paddingLeft: 16 }}>
						Selected {selectedFeatures.length}:
					</span>
					<button
						onClick={() => 0 /* TODO */}
						style={{ padding: '8px 16px', flex: 1 }}
					>
						Move/Clone
					</button>
					<button
						onClick={() => 0 /* TODO */}
						style={{ padding: '8px 16px', flex: 1 }}
					>
						Delete
					</button>
				</div>
			)}
		</>
	)
}
