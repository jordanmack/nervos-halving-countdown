import {useEffect, useState} from 'react';
import useInterval from 'react-useinterval';

import './App.scss';

const TICK_DELAY = 500;

function calculateTimeString(timeFromNow)
{
	const second = 1000;
	const minute = second * 60;
	const hour = minute * 60;
	const day = hour * 24;
	const month = day * 30;
	const year = day * 365;

	const years = Math.floor(timeFromNow / year);
	const months = Math.floor((timeFromNow - (years * year)) / month);
	const days = Math.floor((timeFromNow - (months * month + years * year)) / day);
	const hours = Math.floor((timeFromNow - (days * day + months * month + years * year)) / hour);
	const minutes = Math.floor((timeFromNow - (hours * hour + days * day + months * month + years * year)) / minute);
	const seconds = Math.ceil((timeFromNow - (minutes * minute + hours * hour + days * day + months * month + years * year)) / second);

	let string = '';

	if(years > 0) { string += years+' year'+(years>1?'s':'')+', '; }
	if(months > 0) { string += months+' month'+(months>1?'s':'')+', '; }
	if(days > 0) { string += days+' day'+(days>1?'s':'')+', '; }
	if(hours > 0) { string += hours+' hour'+(hours>1?'s':'')+', '; }
	if(minutes > 0) { string += minutes+' minute'+(minutes>1?'s':'')+', '; }
	string += ' and '+seconds+' second'+(seconds!==1?'s':'')+'. ';

	return string;
}

function updateCountdown(setCountdown, targetTime)
{
	if(targetTime)
		setCountdown(calculateTimeString(targetTime - Date.now()));
}

async function updateTarget(setTargetTime, setTargetEpoch)
{
	const { data: {attributes: { epoch_info: { epoch_number, epoch_length, index } }} } = await fetch('https://corsproxy.io/?https%3A%2F%2Fmainnet-api.explorer.nervos.org%2Fapi%2Fv1%2Fstatistics',
	{
		headers:
		{
			'content-type': 'application/vnd.api+json',
			'accept': 'application/vnd.api+json'
		},
		mode: 'cors'
	})
	.then(res => res.json());
	
	const HOURS_PER_EPOCH = 4;
	const EPOCHS_PER_HALVING = 8760;
	const targetEpoch = Math.floor(epoch_number / EPOCHS_PER_HALVING) * EPOCHS_PER_HALVING + EPOCHS_PER_HALVING;
  
	const targetDuration = Math.floor((targetEpoch - (parseInt(epoch_number) + (parseInt(index) / parseInt(epoch_length)))) * HOURS_PER_EPOCH * 60*60*1000); // Time until epoch in milliseconds.
	const targetTime = Date.now() + targetDuration;

	setTargetTime(targetTime);
	setTargetEpoch(targetEpoch);
}

function App()
{
	const [targetTime, setTargetTime] = useState(0);
	const [targetEpoch, setTargetEpoch] = useState(0);
	const [countdown, setCountdown] = useState('...');

	useEffect(()=>{updateTarget(setTargetTime, setTargetEpoch);}, []);
	useInterval(()=>{updateCountdown(setCountdown, targetTime);}, TICK_DELAY);

	const html =
	(
		<div className="App">
			<header className="App-header">
				<p>
					Time until the next halving on Nervos CKB Layer 1:
				</p>
				<p>
					{countdown}
				</p>
				<p>
					<small>
						{targetEpoch ? 'The next halving is epoch '+targetEpoch+', estimated to be reached on '+(new Date(targetTime)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"long", day:"numeric"})+'.' : ''}
					</small>
				</p>
			</header>
		</div>
	);
	return html;
}

export default App;
