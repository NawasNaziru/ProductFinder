const { app, BrowserWindow } = require("electron");
const server = require("./app"); // your Express.js app file
const ejse = require("ejs-electron"); // require ejs-electron module

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL("file://" + __dirname + "/index.ejs"); // load ejs file

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("resize", function (e, x, y) {
  mainWindow.setSize(x, y);
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// set some data and options for ejs
ejse.data("title", "ProductFinder");
ejse.options("cache", true);
