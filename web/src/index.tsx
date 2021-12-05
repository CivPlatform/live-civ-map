import 'antd/dist/antd.css'
import React from 'react'
import ReactDOM from 'react-dom'
import { RecoilRoot } from 'recoil'
import { App } from './App'
import './index.css'
import { MobxContext, RootStore } from './model'
import { checkUrlParamsLogin } from './model/DiscordLogin'

checkUrlParamsLogin()

ReactDOM.render(
	<React.StrictMode>
		<MobxContext.Provider value={new RootStore()}>
			<RecoilRoot>
				<App />
			</RecoilRoot>
		</MobxContext.Provider>
	</React.StrictMode>,
	document.getElementById('root')
)
