import { observer } from 'mobx-react-lite'
import { useMobx } from './model'
import { avatarUrlForUser } from './model/DiscordLogin'

export const DiscordUserIcon = observer(function DiscordUserIcon(
	props: React.DetailedHTMLProps<
		React.ImgHTMLAttributes<HTMLImageElement>,
		HTMLImageElement
	>
) {
	const loginStore = useMobx().login
	const profile = loginStore.profile
	if (!profile) {
		return (
			<img
				src="/images/discord-bw.svg"
				alt="Discord Login"
				title="Log in with Discord"
				onClick={() => {
					document.location.href = loginStore.prepareOAuthLoginUrl()
				}}
				{...props}
				style={{ borderRadius: 999, opacity: 0.4, ...props.style }}
			/>
		)
	}
	const avatarUrl = avatarUrlForUser(profile)
	return (
		<img
			src={avatarUrl}
			alt="Discord avatar"
			title={`@${profile.username}#${profile.discriminator}`}
			{...props}
			style={{ borderRadius: 999, ...props.style }}
		/>
	)
})
