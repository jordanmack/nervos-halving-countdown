import {useEffect, useState} from 'react';
import useInterval from 'react-useinterval';

import './App.scss';

/**
 * Constants
 */
const CKB_RPC_URL = 'https://mainnet.ckb.dev/rpc';	// The JSON RPC URL of the CKB Full Node to query.
const EPOCHS_PER_HALVING = 8760;					// The number of epochs per halving. This should never change.
const HOURS_PER_EPOCH = 4;							// The number of hours per epoch. This should never change.
const TICK_DELAY = 500;								// The delay in milliseconds to update the countdown.
const REFRESH_DELAY = 11 * 1000;					// The delay in milliseconds to refresh the RPC data and update the current block and epoch.
const FULL_REFRESH_DELAY = 5 * 60 * 1000;			// The delay in milliseconds to refresh all RPC data and update all current values and target values.

/**
 * Generates a string that describes the amount of time remaining in the countdown.
 * @param timeFromNow The number of milliseconds until the target time.
 * @returns null
 */
function calculateTimeString(timeFromNow: number)
{
	// If the time has passed, display a message instead of a time.
	if(timeFromNow < 1)
		return 'Happy Halving! 🎈🎉🎈🍾';

	// Time constants (in milliseconds).
	const second = 1000;
	const minute = second * 60;
	const hour = minute * 60;
	const day = hour * 24;
	const month = day * 30;
	const year = day * 365;

	// Calculate values for the target.
	const years = Math.floor(timeFromNow / year);
	const months = Math.floor((timeFromNow - (years * year)) / month);
	const days = Math.floor((timeFromNow - (months * month + years * year)) / day);
	const hours = Math.floor((timeFromNow - (days * day + months * month + years * year)) / hour);
	const minutes = Math.floor((timeFromNow - (hours * hour + days * day + months * month + years * year)) / minute);
	const seconds = Math.floor((timeFromNow - (minutes * minute + hours * hour + days * day + months * month + years * year)) / second);

	// Create the time string from the target values.
	let string = '';
	if(years > 0) { string += years+' year'+(years>1?'s':'')+', '; }
	if(months > 0) { string += months+' month'+(months>1?'s':'')+', '; }
	if(days > 0) { string += days+' day'+(days>1?'s':'')+', '; }
	if(hours > 0) { string += hours+' hour'+(hours>1?'s':'')+', '; }
	if(minutes > 0) { string += minutes+' minute'+(minutes>1?'s':'')+', '; }
	if(minutes > 0) { string += ' and '+seconds+' second'+(seconds!==1?'s':'')+'. '; }
	else { string += ' '+seconds+' second'+(seconds!==1?'s':'')+' '; }

	return string;
}

/**
 * Sets the target string depending on the target epoch and target time.
 * @param setTargetString A React function to set the target string.
 * @param targetEpoch The epoch of the next halving.
 * @param targetTime The approximate time of the next halving.
 */
function updateTargetString(setTargetString: React.Dispatch<React.SetStateAction<string>>, targetEpoch: number, targetTime: number)
{
	// Set the default string to nbsp to ensure the line is always normal height.
	let string = ' ';

	// Set the target string.
	if(targetEpoch)
	{
		const date = (new Date(targetTime)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"long", day:"numeric"});
		string = `The next halving is estimated to be reached on ${date}.`;
	}

	setTargetString(string);
}

/**
 * Update the countdown with the time string.
 * @param setCountdown A React function to set the countdown string.
 * @param targetTime The approximate time of the next halving.
 */
function updateCountdown(setCountdown: React.Dispatch<React.SetStateAction<string>>, targetTime: number)
{
	if(targetTime)
		setCountdown(calculateTimeString(targetTime - Date.now()));
}

/**
 * Update all data using the CKB JSON RPC.
 * @param setTargetTime A React function to set the target time of the next halving, or null to skip.
 * @param setTargetEpoch A React function to set the target epoch of the next halving, or null to skip.
 * @param setCurrentBlock A React function to set the current block number, or null to skip.
 * @param setCurrentEpoch A React function to set the current epoch number, or null to skip.
 * @param setCurrentEpochIndex A React function to set the current epoch index, or null to skip.
 * @param setCurrentEpochLength A React function to set the current epoch length, or null to skip.
 */
async function updateData(setTargetTime: React.Dispatch<React.SetStateAction<number>>|null,
	setTargetEpoch: React.Dispatch<React.SetStateAction<number>>|null,
	setCurrentBlock: React.Dispatch<React.SetStateAction<number>>|null,
	setCurrentEpoch: React.Dispatch<React.SetStateAction<number>>|null,
	setCurrentEpochIndex: React.Dispatch<React.SetStateAction<number>>|null,
	setCurrentEpochLength: React.Dispatch<React.SetStateAction<number>>|null)
{
	// Fetch current header info from a CKB node. (RPC Documentation: https://github.com/nervosnetwork/ckb/blob/master/rpc/README.md#method-get_tip_header)
	const jsonRpcRequest =
	{
		"id": 42,
		"jsonrpc": "2.0",
		"method": "get_tip_header",
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
	let {result: {epoch: epochNumberWithFraction, number: blockNumber}} = await fetch(CKB_RPC_URL, fetchRequest)
	.then(res => res.json());

	// Decode block number. (RPC Documentation: https://github.com/nervosnetwork/ckb/blob/master/rpc/README.md#type-blocknumber)
	blockNumber = Number(blockNumber);

	// Decode the epoch data into usable components. (RPC Documentation: https://github.com/nervosnetwork/ckb/blob/master/rpc/README.md#type-epochnumberwithfraction)
	epochNumberWithFraction = BigInt(epochNumberWithFraction);
	const epochLength = Number((epochNumberWithFraction & 72056494526300160n) >> 40n);
	const epochIndex = Number((epochNumberWithFraction & 1099494850560n) >> 24n);
	const epochNumber = Number(epochNumberWithFraction & 16777215n);

	// Calculate the target epoch.
	const targetEpoch = Math.floor(epochNumber / EPOCHS_PER_HALVING) * EPOCHS_PER_HALVING + EPOCHS_PER_HALVING;

	// Calculate the duration and time of the target epoch.
	const targetDuration = Math.floor((targetEpoch - (epochNumber + (epochIndex / epochLength))) * HOURS_PER_EPOCH * 60*60*1000); // Time until epoch in milliseconds.
	const targetTime = Date.now() + targetDuration; // Date in the future when the epoch will occur.

	// Update values where a setter was provided.
	if(setTargetTime) setTargetTime(targetTime);
	if(setTargetEpoch) setTargetEpoch(targetEpoch);
	if(setCurrentBlock) setCurrentBlock(blockNumber);
	if(setCurrentEpoch) setCurrentEpoch(epochNumber);
	if(setCurrentEpochIndex) setCurrentEpochIndex(epochIndex);
	if(setCurrentEpochLength) setCurrentEpochLength(epochLength);
}

function App()
{
	const [currentBlock, setCurrentBlock] = useState(0);
	const [currentEpoch, setCurrentEpoch] = useState(0);
	const [currentEpochIndex, setCurrentEpochIndex] = useState(0);
	const [currentEpochLength, setCurrentEpochLength] = useState(0);
	const [targetTime, setTargetTime] = useState(0);
	const [targetEpoch, setTargetEpoch] = useState(0);
	const [countdown, setCountdown] = useState('...');
	const [targetString, setTargetString] = useState(' ');

	// Update the data from the RPC on load.
	useEffect(()=>{updateData(setTargetTime, setTargetEpoch, setCurrentBlock, setCurrentEpoch, setCurrentEpochIndex, setCurrentEpochLength);}, []);
	// Update the block and epoch from the RPC, but omit the target time and target epoch to allow the countdown to track more smoothly without retargeting every few seconds as a block is found.
	useInterval(()=>{updateData(null, null, setCurrentBlock, setCurrentEpoch, setCurrentEpochIndex, setCurrentEpochLength);}, REFRESH_DELAY);
	// Update the all data from the RPC including targets. This will cause the countdown to readjust, which is why the frequency is less often.
	useInterval(()=>{updateData(setTargetTime, setTargetEpoch, setCurrentBlock, setCurrentEpoch, setCurrentEpochIndex, setCurrentEpochLength);}, FULL_REFRESH_DELAY);
	// Update the countdown at the specified tick interval.
	useInterval(()=>
	{
		updateCountdown(setCountdown, targetTime);
		updateTargetString(setTargetString, targetEpoch, targetTime);
	}, TICK_DELAY);

	const html =
	(
		<div className="App">
			<section className="max-w-screen-lg min-w-[375px] mx-auto px-2 md:px-0 py-24">
				<p className="text-center text-2xl mb-2">
					Nervos CKB Layer 1 Halving Countdown
				</p>
				<p className="text-center text-3xl mb-4">
					{countdown}
				</p>
				<p className="text-center text-sm mb-12">
					{targetString}
				</p>
				<div className="max-w-screen-md flex flex-row justify-evenly mx-auto px-2 md:px-0">
					<div className="grow text-center max-w-[150px]">
						<p className="my-0">Current Block</p>
						<p className="my-0">{currentBlock.toLocaleString()}</p>
					</div>
					<div className="grow text-center max-w-[150px]">
						<p className="my-0">Current Epoch</p>
						<p className="my-0">{currentEpoch.toLocaleString()} <small className="text-[0.7rem]">{currentEpochIndex.toLocaleString()}/{currentEpochLength.toLocaleString()}</small></p>
					</div>
					<div className="grow text-center max-w-[150px]">
						<p className="my-0">Target Epoch</p>
						<p className="my-0">{targetEpoch.toLocaleString()}</p>
					</div>
				</div>
			</section>
			<section className="max-w-screen-md min-w-[375px] mx-auto mb-24 px-2 md:px-0">
				<article className="mb-16">
					<h2 className="text-center">What is a Halving Event?</h2>
					<p>
						In the Nervos ecosystem, mining is used to created and distribute new tokens within the ecosystem. A total of 33.6 billion CKB tokens will be created through primary issuance as block rewards to incentivize miners to secure the network.
					</p>
					<p>
						Every epoch, a period of approximately four hours, a fixed amount of 1,917,808 CKB is introduced. Every 8,760 epochs, a period of approximately four years, the amount is cut in half. This event is called a <b>halving</b> and it is the point where the mining rewards from primary issuance are permanently reduced by 50%. This halving process will continue every four years until the year 2103, after which point all block rewards from primary issuance will cease completely.
					</p>
					<p>
						<a href="nervos-halving-table.png" target="_blank" rel="noreferrer"><img className="max-w-xs mx-auto" src="nervos-halving-table.png" alt="Nervos Halving Table" /></a>
					</p>
				</article>
				<article className="mb-16">
					<h2 className="text-center">What is the Significance of a Halving?</h2>
					<p>
						Each time a halving occurs, it causes a sharp decrease in the rewards generated per block. The supply of new CKB entering circulation is lowered, dramatically reducing the rate of inflation. This creates a shift in the underly market equilibrium and forces a reevaluation of what is considered fair market value.
					</p>
					<p>
						<a href="https://explorer.nervos.org/charts/inflation-rate" target="_blank" rel="noreferrer"><img className="max-w-xs mx-auto" src="nervos-inflation-rate-chart.png" alt="Nervos CKB Inflation Rate Chart" /></a>
					</p>
				</article>
				<article className="mb-16">
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
				</article>
			</section>
			<footer className="text-center text-xs mb-4">
				Copyright &copy; 2022-{(new Date()).getFullYear()}, NervosHalving.com. All rights reserved.
				<br />
				Made by the Nervos Community in collaboration with <a href="https://dotmatrix.im/" target="_blank" rel="noreferrer">DotMatrix</a>.
				{" "}
				Source available on <a href="https://github.com/jordanmack/nervos-halving-countdown" target="_blank" rel="noreferrer">GitHub</a>.
			</footer>
		</div>
	);
	return html;
}

export default App;
