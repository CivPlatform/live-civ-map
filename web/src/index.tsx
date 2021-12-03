import 'antd/dist/antd.css'
import React from 'react'
import ReactDOM from 'react-dom'
import { RecoilRoot } from 'recoil'
import { App } from './App'
import { checkUrlParamsLogin } from './DiscordLogin'
import './index.css'

checkUrlParamsLogin()

ReactDOM.render(
	<React.StrictMode>
		<RecoilRoot>
			<App />
		</RecoilRoot>
	</React.StrictMode>,
	document.getElementById('root')
)
