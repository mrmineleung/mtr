import React, { useEffect, useState } from 'react';
import './App.css';
import { Container, Table, Button, Row, Col, Alert } from 'reactstrap';
import Dropdown from './customize/Dropdown';
import SkeletonLoader from 'tiny-skeleton-loader-react';
import mtr_sta from './data/MTRStation';
import mtr_line_menu from './data/Menu'


function MTRNextTrain() {

	const [trainData, setTrainData] = useState({ up: [], down: [] });



	const [urlParam, setUrlParam] = useState({ mtr_line: mtr_line_menu[0].code, mtr_sta: mtr_line_menu[0].submenu[0].code });
	const [dropdownLabel, setDropdownLabel] = useState({ mtr_line: mtr_line_menu[0].desc, mtr_sta: mtr_line_menu[0].submenu[0].desc });
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [isRefresh, setIsRefresh] = useState(true);
	const [isSpecialTrainServicesArrangement, setIsSpecialTrainServicesArrangement] = useState(false);
	const [specialTrainServicesArrangement, setSpecialTrainServicesArrangement] = useState({});
	const [weatherWarningMessage, setWeatherWarningMessage] = useState("");


	const handleRefreshButton = () => {
		setIsRefresh(!isRefresh)
	}

	useEffect(() => {

		fetch(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${urlParam.mtr_line}&sta=${urlParam.mtr_sta}&lang=tc`, { keepalive: true })
			.then(response => {
				setIsLoading(true)
				return response.json()
			})
			.then(data => {
				console.log(data)
				setIsError(false)
				setIsSpecialTrainServicesArrangement(false)

				if (data.status === 1) {
					let name = `${urlParam.mtr_line}-${urlParam.mtr_sta}`
					let { UP: up, DOWN: down } = data.data[name]
					console.log("up", up, "down", down)
					if (up === null || up === undefined) {
						up = [{ curr_time: 0, time: 0, plat: '', dest: 'NUL', ttnt: '' }]
					}

					if (down === null || down === undefined) {
						down = [{ curr_time: 0, time: 0, plat: '', dest: 'NUL', ttnt: '' }]
					}
					setTrainData({ up: up, down: down })
				} else if (data.status === 0) {
					setIsSpecialTrainServicesArrangement(true)
					setSpecialTrainServicesArrangement({ message: data.message, url: data.url })
				}
				setTimeout(function() {
					setIsLoading(false)
				 }, 10000);

			})
			.catch(error => {
				console.error(error)
				setIsError(true)
				setTimeout(function() {
					setIsLoading(false)
				 }, 10000);
				setIsRefresh(false)
				setIsSpecialTrainServicesArrangement(false)
			})


		fetch(`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en`, { keepalive: true })
			.then(response => response.json())
			.then(data => {
				console.log(data)
				setIsLoading(true)
				setIsError(false)
				let { warningMessage } = data.warningMessage
				setWeatherWarningMessage(warningMessage)
				setTimeout(function() {
					setIsLoading(false)
				 }, 1000);
				

			})
			.catch(error => {
				console.error(error)
				setIsError(true)
				setTimeout(function() {
					setIsLoading(false)
				 }, 1000);
			})

	}
		, [urlParam, isRefresh])

	useEffect(() => {
		const interval = setInterval(handleRefreshButton, 10000);
		return () => clearInterval(interval);
	})


	return (
		<Container>
			<h1>MTR Next Train</h1>
			<Row className="justify-content-md-center">
				<Col>
					<Dropdown title={dropdownLabel.mtr_line}
						buttonList={mtr_line_menu}
						returnUrlParam={(line, sta) => setUrlParam({ mtr_line: line, mtr_sta: sta })}
						returnDropdownLabel={(line, sta) => setDropdownLabel({ mtr_line: line, mtr_sta: sta })} >
					</Dropdown>
				</Col>
			</Row>
			<p></p>
			<Row className="justify-content-md-center">
				<Col>
					<Dropdown title={dropdownLabel.mtr_sta}
						buttonList={mtr_line_menu}
						returnUrlParam={(line, sta) => setUrlParam({ mtr_line: line, mtr_sta: sta })}
						returnDropdownLabel={(line, sta) => setDropdownLabel({ mtr_line: line, mtr_sta: sta })}
						mtrLine={urlParam.mtr_line}
						submenu="true">
					</Dropdown>
				</Col>
			</Row>
			<p></p>
			<Row className="justify-content-md-center">
				<Col>
					<Button color="info" onClick={() => handleRefreshButton()} size="lg" block>Refresh</Button>
				</Col>
			</Row>


			{isError ? (<p>Error occurs. Try again. </p>) : (null)}
			{isSpecialTrainServicesArrangement ?
				(<Alert color="danger">
					{specialTrainServicesArrangement.message} {specialTrainServicesArrangement.url !== null || specialTrainServicesArrangement.url !== undefined ? (<a href={specialTrainServicesArrangement.url}>Link</a>) : (null)}
				</Alert>) : (null)}

			<br></br>
			{/*weatherWarningMessage !== null || weatherWarningMessage !== undefined || weatherWarningMessage.length > 0 ?
				(
					weatherWarningMessage.map(item => <Row key={item}><Col><Alert color="danger">{item}</Alert></Col></Row>)
				) : (null)*/}

			{weatherWarningMessage ?
				(
					<Row><Col><Alert color="danger">{weatherWarningMessage}</Alert></Col></Row>)
				: (null)}

			<Table className="mt-4">
				<thead>
					<tr><th colSpan="4">To {mtr_line_menu.filter(x => x.code === urlParam.mtr_line).map(item => item.submenu[item.submenu.length - 1].desc)} (UP)</th></tr>
					<tr><th></th></tr>
					<tr>
						<th>Arrival Time</th>
						<th>Platform</th>
						<th>Destination</th>
						<th>Minute(s) Left</th>
					</tr>
				</thead>
				<tbody>
					{isLoading? 
					<tr><td colSpan="4"><SkeletonLoader/></td></tr>
				
					 : trainData.up.map(item => (
						<tr key={item.curr_time + item.ttnt}>
							<td>{item.time}</td>
							<td>Platform {item.plat}</td>
							<td>{mtr_sta.find(sta => sta.code === item.dest).desc}</td>
							<td>{item.ttnt} mins</td>
						</tr>
					))}
				</tbody>
			</Table>


			<Table className="mt-4">
				<thead>
					<tr><th colSpan="4">To {mtr_line_menu.filter(x => x.code === urlParam.mtr_line).map(item => item.submenu[0].desc)} (DOWN)</th></tr>
					<tr><th></th></tr>
					<tr>
						<th>Arrival Time</th>
						<th>Platform</th>
						<th>Destination</th>
						<th>Minute(s) Left</th>
					</tr>
				</thead>
				<tbody>
					{isLoading? <tr><td colSpan="4"><SkeletonLoader/></td></tr> :
					trainData.down.map(item => (
						<tr key={item.curr_time + item.ttnt}>
							<td>{item.time}</td>
							<td>Platform {item.plat}</td>
							<td>{mtr_sta.find(sta => sta.code === item.dest).desc}</td>
							<td>{item.ttnt} mins</td>
						</tr>
					))}
				</tbody>
			</Table>
		</Container>
	);
}

export default MTRNextTrain;
