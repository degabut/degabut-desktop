import { BrowserWindow } from "electron";
import { Process } from "./process";

export abstract class Window extends Process {
	window!: BrowserWindow;
}
