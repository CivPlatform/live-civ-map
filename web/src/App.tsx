import './App.css'
import { avatarUrlForUser, useDiscordProfile } from './DiscordLogin'

function App() {
	return (
		<div className="App">
			<div
				className="App-Map"
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					minHeight: '100%',
				}}
			>
				Map
			</div>
			<div className="App-Menu">
				<div>
					<img src="" alt="Logo" />
					<span>Menu</span>
				</div>
				<div style={{ flex: 1 }} />
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
			<div>
				<img src="" alt="" />
				<span>Log in with Discord</span>
			</div>
		)
	}
	const avatarUrl = avatarUrlForUser(profile)
	return (
		<div>
			<img src={avatarUrl} alt="Discord avatar" />
			<span>
				@{profile.username}#{profile.discriminator}
			</span>
		</div>
	)
}
