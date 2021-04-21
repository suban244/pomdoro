import React from "react";
import ModeForm from "./ModeForm";
import Timer from "./Timer";
import Pom from "./Pom";
import { Taskbar } from "./Tasks";

let cron;

export default class Pomodoro extends React.Component {
	constructor(props) {
		super(props);
		let mode = parseInt(localStorage.getItem("Pomodoro_Mode") || 1);
		this.state = {
			mode: mode,
			running: false,
			started: false,
			clock: mode === 1 ? 0 : 1500,
			pom: {},
			task: {},
			activeTask: false,
		};
		// this.handleModeChange = this.handleModeChangoe.bind(this);
		this.Quit = this.Quit.bind(this);
		this.handleTaskSet = this.handleTaskSet.bind(this);
		this.clearActiveTask = this.clearActiveTask.bind(this);
	}
	async sendPom() {
		let obj = this.state.pom;
		if (obj && Object.keys(obj).length === 0 && obj.constructor === Object) {
			return;
		}
		let task = this.state.task;
		let taskID;
		if (task && Object.keys(task).length === 0 && task.constructor === Object) {
			taskID = "";
		} else {
			taskID = task.getID();
		}
		obj.task = taskID;
		await fetch("http://localhost:5000/api/pomodoro", {
			method: "POST",
			mode: "cors",
			credentials: "same-origin",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(obj),
		});
	}

	handleModeChange = (newMode) => {
		const mode = parseInt(newMode);
		this.Pause();
		this.setState({
			mode: mode,
			running: false,
			started: false,
			clock: mode === 1 ? 0 : 1500,
		});
		localStorage.setItem("Pomodoro_Mode", mode);
	};

	handleTaskSet(task) {
		// TODO
		this.setState({ task: task, activeTask: true });
	}
	clearActiveTask() {
		this.setState({ task: {}, activeTask: false });
	}

	handleClick() {
		if (this.state.running) {
			// Pause
			this.Pause();
			let pom = this.state.pom;
			pom.pauseEvent();
			this.setState({ pom: pom });
			return;
		} else {
			// Start / Continue Pomodoro

			// New few lines do not work without this check idk why.
			let madePom = false; // A check to see if i make a new pom in the next if statement
			if (!this.state.started) {
				this.setState({ pom: new Pom(), started: true });
				madePom = true;
			}
			this.Pause();
			cron = setInterval(() => {
				this.Update();
			}, 1000);
			if (!madePom) {
				// Maybe i can't query for state after i set it to a new one
				let pom = this.state.pom;
				pom.continueEvent();
				this.setState({ pom: pom });
			}
			this.setState({ running: true });
			return;
		}
	}
	Quit() {
		let pom = this.state.pom;
		pom.pauseEvent();
		this.sendPom().then(() => console.log("POM sent"));

		if (this.state.mode === 1)
			this.setState({
				clock: 0,
				running: false,
				started: false,
				pom: {},
			});
		else
			this.setState({
				clock: 1500,
				running: false,
				started: false,
				pom: {},
			});
		this.Pause();
	}
	Update() {
		if (this.state.mode === 1) this.setState({ clock: this.state.clock + 1 });
		else {
			let finished = false;
			if (this.state.clock === 1) finished = true;
			this.setState({ clock: this.state.clock - 1 });

			if (finished) this.Quit();
		}
		// this.setState({ time: toReturn });
	}
	Pause() {
		clearInterval(cron);
		this.setState({ running: false });
	}
	render() {
		return (
			<div>
				<ModeForm
					currentMode={this.state.mode}
					handleModeChange={(newMode) => this.handleModeChange(newMode)}
				/>
				{this.state.activeTask && (
					<Taskbar
						task={this.state.task}
						clearActiveTask={() => this.clearActiveTask()}
					/>
				)}
				<Timer
					mode={this.state.mode}
					handleClick={() => this.handleClick()}
					handleTaskSet={(task) => this.handleTaskSet(task)}
					clock={this.state.clock}
					started={this.state.started}
					running={this.state.running}
					task={this.state.task}
					activeTask={this.state.activeTask}
					clearActiveTask={() => this.clearActiveTask()}
					quit={this.Quit}
				/>
			</div>
		);
	}
}
