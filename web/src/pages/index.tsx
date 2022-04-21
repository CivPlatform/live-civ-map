// We cannot use encodeURIComponent because of double decoding issues (How is the browser/router supposed to know whether a URL has already been decoded?), also in relation to react-router.
// Use ~ for escaping because we expect it to be rare.
// Remove any leading wss protocol from layers for nicer common URLs, but leave ws (insecure) and http/s (read-only) intact.

export function featureSlugFromId(featureId: string) {
	return featureId
		.replaceAll('~', '~~')
		.replaceAll('/', '~s') // "slash"
		.replaceAll('?', '~q') // "query"
		.replaceAll('#', '~f') // "fragment"
		.replaceAll(' ', '~w') // "whitespace"
	// .replaceAll(/\s/g, (m) => `~x{encode(m)};`) // "hex"
}

export function featureIdFromSlug(slug: string) {
	return slug
		.split('~~') // handle overlaps: ~~q (-> ~q) vs ~~~q (-> ~?)
		.map(
			(s) =>
				s
					.replaceAll('~s', '/')
					.replaceAll('~q', '?')
					.replaceAll('~f', '#')
					.replaceAll('~w', ' ')
			// .replaceAll(hexEscapeRE, (m) => decode(hexEscapeRE.exec(m)![1]))
		)
		.join('~')
}

// const hexEscapeRE = /\~x[0-9a-f]+;/g

export function layerSlugFromUrl(layerUrl: string) {
	return layerUrl
		.replace(/^wss:\/\//, '') // save space; wss is expected to be most common
		.replaceAll('~', '~~')
		.replaceAll('/', '~s')
		.replaceAll('?', '~q')
		.replace(/#.*/, '') // fragment can't be part of layer id
}

export function layerUrlFromSlug(slug: string) {
	slug = slug
		.split('~~')
		.map((s) => s.replaceAll('~s', '/').replaceAll('~q', '?'))
		.join('~')
	slug = slug.match(/^(ws|http)s?:\/\/.*/) ? slug : 'wss://' + slug
	return slug
}

export const defaultLayerServer = 'wss://civmap.herokuapp.com/'

export const getLayerHostFromUrl = (layerUrl: string) => new URL(layerUrl).host
export const getLayerNameFromUrl = (layerUrl: string) =>
	new URL(layerUrl).pathname.substr(1).replace(/.json~/, '')
