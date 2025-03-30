import {useEffect, useState} from 'react';
import useInterval from 'react-useinterval';

import './App.scss';

/**
 * Constants
 */
const CKB_RPC_URL = 'https://rpc.ankr.com/nervos_ckb/efc49fb99eb7ca93a07557e97c0900f236f88d9c49a5f169f8f9c6963ed42f99';	// The JSON RPC URL of the CKB Full Node to query.
const EPOCHS_PER_HALVING = 8760;						// The number of epochs per halving. This should never change.
const HOURS_PER_EPOCH = 4;								// The number of hours per epoch. This should never change.
const HALVING_MESSAGE_HIDE_DELAY = 10 * 60 * 1000;		// The delay in milliseconds to continue to display the halving message after it occurs.
const TICK_DELAY = 500;									// The delay in milliseconds to update the countdown.
const REFRESH_DELAY = 11 * 1000;						// The delay in milliseconds to refresh the RPC data and update the current block and epoch.
const FULL_REFRESH_DELAY = 5 * 60 * 1000;				// The delay in milliseconds to refresh all RPC data and update all current values and target values.

/**
 * Generates time values in months, days, hours, minutes, and seconds based on the time remaining in the countdown.
 * @param timeFromNow The number of milliseconds until the target time.
 * @returns object
 */
function calculateTimeValues(timeFromNow: number)
{
	// Time constants (in milliseconds).
	const second = 1000;
	const minute = second * 60;
	const hour = minute * 60;
	const day = hour * 24;
	const month = day * 30;

	// Calculate values for the target.
	const months = Math.floor((timeFromNow) / month);
	const days = Math.floor((timeFromNow - (months * month)) / day);
	const hours = Math.floor((timeFromNow - (days * day + months * month)) / hour);
	const minutes = Math.floor((timeFromNow - (hours * hour + days * day + months * month)) / minute);
	const seconds = Math.floor((timeFromNow - (minutes * minute + hours * hour + days * day + months * month)) / second);

	// Create the time object from the target values.
	let object = {months: 0, days: 0, hours: 0, minutes: 0, seconds: 0};
	object.months = months;
	object.days = days;
	object.hours = hours;
	object.minutes = minutes;
	object.seconds = seconds;

	return object;
}

/**
 * Renders a counter circle with the specified information.
 * @param value The number value for the middle of the circle.
 * @param label The label to display below the circle.
 * @returns JSX code to render a counter circle.
 */
function renderCounterCircle(value: number, label: string)
{
	const html =
	(
		<div className="time-value months inline-block relative w-[60px] md:w-[115px] mx-1 leading-none">
			<img className="circle block w-full" src="countdown-circle.png" alt="Counter Circle" />
			<span className="number absolute w-full top-4 md:top-9 left-0 text-center text-teal-300 text-xl md:text-4xl">{value}</span>
			<label className="text-white text-base md:text-xl leading-">{label}</label>
		</div>
	);

	return html;
};

/**
 * Renders a stats box based on the specified information.
 * @param label The primary label for the stats box.
 * @param metric The primary metric value.
 * @param metricSm The secondary metric value, which will be displayed in a small text size.
 * @returns JSX code to render a stats box.
 */
function renderStatsBox(label: string, metric: string|null, metricSm: string|null)
{
	const html =
	(
		<div className="stats-box grow text-center w-full shrink-0 my-1 md:max-w-[150px] rounded p-3 bg-gradient-to-b from-teal-600/30 to-teal-900/10">
			<p className="my-0 text-center text-sm">{label}</p>
			<p className="my-0 text-center text-lg">{metric} <small className="text-xs">{metricSm}</small></p>
		</div>
	);

	return html;
}

/**
 * Generate the target date string depending on the target epoch and target time.
 * @param targetEpoch The epoch of the next halving.
 * @param targetTime The approximate time of the next halving.
 */
function generateTargetString(targetEpoch: number, targetTime: number)
{
	// Set the default string to nbsp to ensure the line is always normal height.
	let string = ' ';

	// Set the target string.
	if(targetEpoch)
	{
		const date = (new Date(targetTime)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"long", day:"numeric"});
		string = `The next halving is estimated to be reached on ${date.replaceAll(' ', ' ')}.`;
	}

	return string;
}

/**
 * Render the countdown with populated counter circles.
 * @param targetTime The approximate time of the next halving.
 */
function renderCountdown(targetTime: number)
{
	if(targetTime)
	{
		const timeRemaining = targetTime - Date.now();
		const halvingMessageWindow = EPOCHS_PER_HALVING * HOURS_PER_EPOCH * 60 * 60 * 1000 - HALVING_MESSAGE_HIDE_DELAY;

		// If there is still time remaining then display the countdown, unless it is immediately after the halving within the hide delay window.
		if(timeRemaining > 0 && timeRemaining < halvingMessageWindow)
		{
			const timeValues = calculateTimeValues(timeRemaining);
			const html =
			(
				<div id="countdown" className="countdown text-2xl">
					{renderCounterCircle(timeValues.months, "months")}
					{renderCounterCircle(timeValues.days, "days")}
					{renderCounterCircle(timeValues.hours, "hours")}
					{renderCounterCircle(timeValues.minutes, "minutes")}
					{renderCounterCircle(timeValues.seconds, "seconds")}
				</div>
			);
			return html;
		}
		// Display a halving message instead of a time.
		else
		{
			const html = <div id="countdown" className="text-4xl leading-[1.5em] md:text-6xl md:leading-[1.5em]">🎈Happy Halving!🎈<br />🎉🍾🎉🍾🎉</div>;
			return html;
		}
	}

	return <div id="countdown" className="loading">&nbsp;</div>;
}

/**
 * Update all or specific data fields using the CKB JSON RPC.
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
	let {result: {epoch: epochNumberWithFraction, number: blockNumber}} = await fetch(CKB_RPC_URL, fetchRequest).then(res => res.json());

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
	const [countdown, setCountdown] = useState(<div id="countdown" className="loading">&nbsp;</div>);
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
		setCountdown(renderCountdown(targetTime));
		setTargetString(generateTargetString(targetEpoch, targetTime));
	}, TICK_DELAY);

	const html =
	(
		<div className="App min-w-[375px]">
			<section className="max-w-screen-md mx-auto px-1 md:px-0 pt-6 md:pt-24">
				<h1 className="text-center mb-8 text-transparent font-bold bg-clip-text bg-gradient-to-r from-teal-300 to-teal-700">
					Nervos&nbsp;CKB&nbsp;Layer&nbsp;1 Halving&nbsp;Countdown
				</h1>
				<h1 className="text-center mb-8">
					{countdown}
				</h1>
				<p className="text-center text-sm mb-12 text-teal-400">
					{targetString}
				</p>
				<div className="max-w-screen-sm flex flex-wrap flex-row justify-evenly mx-auto px-2 md:px-0 mb-8">
					{renderStatsBox("Current Block", currentBlock.toLocaleString(), null)}
					{renderStatsBox("Current Epoch", currentEpoch.toLocaleString(), `${currentEpochIndex.toLocaleString()}/${currentEpochLength.toLocaleString()}`)}
					{renderStatsBox("Target Epoch", targetEpoch.toLocaleString(), null)}
				</div>
			</section>
			<section className="max-w-screen-sm mx-auto px-2 md:px-0 mb-12 h-64 md:h-72 overflow-visible" style={{background: 'url("nervos-logo-glowing.png") 50% 50%/contain no-repeat'}}>
			</section>
			<section className="max-w-screen-sm mx-auto mb-24 px-2 md:px-0">
				<article className="mb-24">
					<h2 className="text-center">What is a Halving Event?</h2>
					<p>
						In the Nervos ecosystem, mining is used to secure the network and distribute tokens in the form of block rewards. A total of 33.6 billion CKB tokens will be created through primary issuance over a period of approximately 84 years to incentivize the miners that secure the network.
					</p>
					<p>
						Every epoch, a period of approximately four hours, a fixed amount of CKB is introduced. Every 8,760 epochs, a period of approximately four years, this amount is cut in half. This event is called a halving and it is the point where the mining rewards from primary issuance are permanently reduced by 50%. This halving process will continue every four years until the year 2103, after which point all block rewards from primary issuance will cease completely.
					</p>
					<p className="pt-8 text-center">
						<a className="md:opacity-50 transition-opacity duration-500 hover:opacity-100" href="https://docs.nervos.org/docs/reference/halving/" target="_blank" rel="noreferrer"><img className="w-full max-w-lg inline" src="nervos-halving-table.png" alt="Nervos Halving Table" /></a>
					</p>
				</article>
				<article className="mb-24">
					<h2 className="text-center">What is the Significance of a Halving?</h2>
					<p>
						Each time a halving occurs, it causes a sharp decrease in the rewards generated per block. The supply of new CKB entering circulation is lowered, dramatically reducing the rate of inflation. This is important because it creates a shift in the underlying market equilibrium and forces a reevaluation of what is considered fair market value.
					</p>
					<p>
						Halving events occur on a predetermined issuance schedule that cannot be changed, postponed, or delayed. Investors and community members often look forward to a halving event as something to celebrate since it marks an important milestone in the history of the project.
					</p>
					<p className="pt-8 text-center">
						<a className="md:opacity-50 transition-opacity duration-500 hover:opacity-100" href="https://explorer.nervos.org/charts/inflation-rate" target="_blank" rel="noreferrer"><img className="w-full max-w-lg inline" src="nervos-inflation-rate-chart.png" alt="Nervos CKB Inflation Rate Chart" /></a>
					</p>
				</article>
				<article className="mb-24">
					<h2 className="text-center">How Could a Halving Affect the Price of CKB?</h2>
					<p>
						A general rule of thumb in economic theory states that steady demand with decreasing supply results in higher pricing. Bitcoin enthusiasts often use the stock-to-flow model as a way to measure the total amount of existing Bitcoin (stock) relative to the amount of Bitcoin produced per year (flow).
					</p>
					<p>
						This stock-to-flow model predicts that a higher the stock-to-flow ratio will result in a higher the price of the asset. This model remains controversial among experts, especially for gauging short-term market sentiment. However, one look at Bitcoin's stock-to-flow chart leads many to believe the theory is worth further consideration.
					</p>
					<p className="pt-8 text-center">
						<a className="md:opacity-50 transition-opacity duration-500 hover:opacity-100" href="https://www.lookintobitcoin.com/charts/stock-to-flow-model/" target="_blank" rel="noreferrer"><img className="w-full max-w-lg inline" src="bitcoin-stock-to-flow-chart.png" alt="Bitcoin Stock to Flow Chart" /></a>
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
