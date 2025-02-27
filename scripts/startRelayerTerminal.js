const { spawn } = require("child_process");
const path = require("path");
const os = require("os");

// ✅ Get the absolute path of the project directory
const projectDir = path.resolve(__dirname, "..");

console.log("🚀 Starting relayer in a new terminal...");

// ✅ Cross-platform terminal command selection
let terminalCommand;
if (os.platform() === "darwin") {
    // macOS: Use Terminal with osascript
    terminalCommand = `cd "${projectDir}" && npm run startRelayer`;
    spawn("osascript", ["-e", `tell application "Terminal" to do script "${terminalCommand}"`]);
} else if (os.platform() === "win32") {
    // Windows: Open Command Prompt
    spawn("cmd.exe", ["/c", `start cmd.exe /k "cd /d ${projectDir} && npm run startRelayer"`]);
} else {
    // Linux: Try opening a new terminal
    spawn("gnome-terminal", ["--", "sh", "-c", `cd "${projectDir}" && npm run startRelayer`])
        .on("error", () => {
            console.error("❌ Failed to open gnome-terminal. Trying x-terminal-emulator...");
            spawn("x-terminal-emulator", ["-e", `sh -c 'cd "${projectDir}" && npm run startRelayer'`]);
        });
}

// ✅ Handle process events
console.log("✅ Relayer script started in a new terminal.");
