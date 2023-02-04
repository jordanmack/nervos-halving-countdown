import {useEffect, useState} from 'react';
import useInterval from 'react-useinterval';

import './App.scss';

const CKB_RPC_URL = 'https://mainnet.ckb.dev/rpc';
const TICK_DELAY = 500;

function calculateTimeString(timeFromNow: number)
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

function updateTargetString(setTargetString: Function, targetEpoch: number, targetTime: number)
{
	let string = ' ';

	if(targetEpoch)
		string = 'The next halving occurs on epoch '+targetEpoch+' and is estimated to be reached on '
			+(new Date(targetTime)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"long", day:"numeric"})+'.';

	setTargetString(string);
}

function updateCountdown(setCountdown: Function, targetTime: number)
{
	if(targetTime)
		setCountdown(calculateTimeString(targetTime - Date.now()));
}

async function updateTarget(setTargetTime: Function, setTargetEpoch: Function)
{
	// Fetch blockchain info from a CKB node.
	const jsonRpcRequest =
	{
		"id": 42,
		"jsonrpc": "2.0",
		"method": "get_blockchain_info",
		"params": []
	};
	const fetchRequest =
	{
		method: 'POST',
		headers:
		{
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(jsonRpcRequest)
	}
	let {result: {epoch: epochNumberWithFraction}} = await fetch(CKB_RPC_URL, fetchRequest)
	.then(res => res.json());

	// Decode the epoch data into usable components. (https://github.com/nervosnetwork/ckb/blob/master/rpc/README.md#type-epochnumberwithfraction)
	epochNumberWithFraction = BigInt(epochNumberWithFraction);
	const epoch_length = Number((epochNumberWithFraction & 72056494526300160n) >> 40n);
	const epoch_index = Number((epochNumberWithFraction & 1099494850560n) >> 24n);
	const epoch_number = Number(epochNumberWithFraction & 16777215n);

	// Calculate the target epoch.
	const HOURS_PER_EPOCH = 4;
	const EPOCHS_PER_HALVING = 8760;
	const targetEpoch = Math.floor(epoch_number / EPOCHS_PER_HALVING) * EPOCHS_PER_HALVING + EPOCHS_PER_HALVING;

	// Calculate the duration and time of the target epoch.
	const targetDuration = Math.floor((targetEpoch - (epoch_number + (epoch_index / epoch_length))) * HOURS_PER_EPOCH * 60*60*1000); // Time until epoch in milliseconds.
	const targetTime = Date.now() + targetDuration; // Date in the future when the epoch will occur.

	setTargetTime(targetTime);
	setTargetEpoch(targetEpoch);
}

function App()
{
	const [targetTime, setTargetTime] = useState(0);
	const [targetEpoch, setTargetEpoch] = useState(0);
	const [countdown, setCountdown] = useState('...');
	const [targetString, setTargetString] = useState(' ');

	useEffect(()=>{updateTarget(setTargetTime, setTargetEpoch);}, []);
	useInterval(()=>
	{
		updateCountdown(setCountdown, targetTime);
		updateTargetString(setTargetString, targetEpoch, targetTime);
	}, TICK_DELAY);

	const html =
	(
		<div className="App">
			<section className="max-w-screen-md min-w-[375px] mx-auto px-2 md:px-0 py-24">
				<p className="text-center text-2xl mb-2">
					Nervos CKB Layer 1 Halving Countdown
				</p>
				<p className="text-center text-3xl mb-4">
					{countdown}
				</p>
				<p className="text-center text-sm">
					{targetString}
				</p>
			</section>
			<section className="max-w-screen-md min-w-[375px] mx-auto mb-24 px-2 md:px-0">
				<h2 className="text-center">What is a Halving Event?</h2>
				<p>
					In the Nervos ecosystem, mining is used to created and distribute new tokens within the ecosystem. A total of 33.6 billion CKB tokens will be created through primary issuance as block rewards to incentivize miners to secure the network.
				</p>
				<p className="mb-16">
					Every epoch, a period of approximately four hours, a fixed amount of 1,917,808 CKB is introduced. Every 8,760 epochs, a period of approximately four years, the amount is cut in half. This event is called a <b>halving</b> and it is the point where the mining rewards from primary issuance are permanently reduced by 50%. This halving process will continue every four years until the year 2103, after which point all block rewards from primary issuance will cease completely.
				</p>
				<h2 className="text-center">What is the Significance of a Halving?</h2>
				<p>
					Each time a halving occurs, it causes a sharp decrease in the rewards generated per block. The supply of new CKB entering circulation is lowered, dramatically reducing the rate of inflation. This creates a shift in the underly market equilibrium and forces a reevaluation of what is considered fair market value.
				</p>
				<p className="mb-16">
					<a href="https://explorer.nervos.org/charts/inflation-rate" target="_blank" rel="noreferrer"><img className="max-w-xs mx-auto" src="nervos-inflation-rate-chart.png" alt="Nervos CKB Inflation Rate Chart" /></a>
				</p>
				<h2 className="text-center">How Could a Halving Affect the Price of CKB?</h2>
				<p>
					A general rule of thumb in economic theory states that steady demand with decreasing supply results in higher pricing. Bitcoin enthusiasts often use the stock-to-flow model as a way to measure the total amount of existing Bitcoin (stock) relative to the amount of Bitcoin produced per year (flow).
				</p>
				<p>
					This stock-to-flow model predicts that the higher the stock-to-flow ratio, the higher the price of the asset. This model remains controversial among experts, especially for gauging short-term market sentiment. However, one look at Bitcoin's stock-to-flow chart leads many to believe the theory is worth further consideration.
				</p>
				<p>
					<a href="https://www.lookintobitcoin.com/charts/stock-to-flow-model/" target="_blank" rel="noreferrer"><img className="max-w-xs mx-auto" src="bitcoin-stock-to-flow-chart.png" alt="Bitcoin Stock to Flow Chart" /></a>
				</p>
			</section>
			<footer className="text-center text-xs mb-4">
				Copyright &copy; 2022-{(new Date()).getFullYear()}, NervosHalving.com. All rights reserved.
				<br />
				Made by the Nervos Community in collaboration with <a href="https://dotmatrix.im/" target="_blank" rel="noreferrer">DotMatrix</a>.
				{" "}
				<a href="https://github.com/jordanmack/nervos-halving-countdown">Source available on GitHub.</a>
			</footer>
		</div>
	);
	return html;
}

export default App;
