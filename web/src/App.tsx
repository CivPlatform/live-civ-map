import './App.css'
import {
	avatarUrlForUser,
	prepareOAuthLoginUrl,
	useDiscordProfile,
} from './DiscordLogin'
import FeaturesMap from './map/FeaturesMap'

function App() {
	return (
		<div className="App">
			<FeaturesMap height="100vh" />
			<div className="App-Menu" style={{ zIndex: 1000 }}>
				<div>
					<img src="" alt="Logo" />
					<span>Menu</span>
				</div>
				<div style={{ flex: 1, minHeight: '1em' }} />
				<DiscordUserIcon />
			</div>
		</div>
	)
}

export default App

export function DiscordUserIcon() {
	const profile = useDiscordProfile()

	if (!profile) {
		return (
			<div onClick={() => (document.location.href = prepareOAuthLoginUrl())}>
				<img src="" alt="" />
				<span>Log in with Discord</span>
			</div>
		)
	}
	const avatarUrl = avatarUrlForUser(profile)
	return (
		<div>
			<img src={avatarUrl} alt="Discord avatar" style={{ borderRadius: 999 }} />
			<span>
				@{profile.username}#{profile.discriminator}
			</span>
		</div>
	)
}
