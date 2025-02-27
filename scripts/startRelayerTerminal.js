const { spawn, exec } = require("child_process");
const path = require("path");
const os = require("os");

// ✅ Get the absolute path of the project directory
const projectDir = path.resolve(__dirname, "..");

console.log("🚀 Starting relayer in a new terminal...");

// ✅ Cross-platform terminal command selection
if (os.platform() === "darwin") {
    // macOS: Use Terminal with osascript
    const terminalCommand = `cd ${projectDir} && npm run startRelayer`;

    // ✅ Fix quote escaping for AppleScript
    const appleScriptCommand = `osascript -e 'tell application "Terminal" to do script "cd '${projectDir}' && npm run startRelayer"'`;

    // ✅ Execute the AppleScript command
    exec(appleScriptCommand, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ Failed to start relayer in a new terminal:", error);
            return;
        }
        if (stderr) console.error("⚠️ STDERR:", stderr);
    });
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
