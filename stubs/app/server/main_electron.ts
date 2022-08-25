import * as places from "app/server/lib/places";
import path from "path";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();

const pyvenvCfgPath = path.resolve(places.getUnpackedAppRoot(), "sandbox_venv3/pyvenv.cfg");

const settingPythonPath = new Promise<void>((done, reject) => {
  fs.readFile(pyvenvCfgPath, { encoding: "utf-8" }, (err, pyvenvCfg) => {
    if (err) throw err;

    const dict = parsePyvenvCfg(fs.readFileSync(pyvenvCfgPath, { encoding: "utf-8" }));
    dict["home"] = path.resolve(places.getUnpackedAppRoot(), "winpython");

    fs.writeFile(pyvenvCfgPath, buildPyvenvCfg(dict), { encoding: "utf-8" }, (err) => {
      if (err) throw err;
      done();
    });
  });
});

function parsePyvenvCfg(pyvenvCfg: string) {
  return pyvenvCfg.split("\n").reduce<Record<string, string>>((dict, strLine) => {
    let [key, value] = strLine.split("=").map((s) => s.trim());
    dict[key] = value;
    return dict;
  }, {});
}

function buildPyvenvCfg(dict: Record<string, string>) {
  return Object.entries(dict).reduce((pyvenvCfg, [key, value]) => {
    if (key) return pyvenvCfg + `${key} = ${value}\n`;
    else return pyvenvCfg;
  }, "");
}

import * as server from "app/server/server";
import { BrowserWindow, app } from "electron";

let mainWindow = null;

async function main() {
  mainWindow = new BrowserWindow();
  mainWindow.on("close", (event) => {
    mainWindow = null;
  });
  await settingPythonPath;
  await server.main();
  mainWindow.loadURL(`http://${process.env.GRIST_HOST}:${process.env.PORT}`);
}

app.on("ready", main);
