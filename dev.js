const { spawn } = require("child_process");

console.log("\x1b[36m%s\x1b[0m", "🚀 SoloSpider AI Monorepo Developer Suite Starting...");
console.log("Starting Next.js Dev Server and background worker concurrently...\n");

function runCommand(command, args, prefix, colorCode) {
  const child = spawn(command, args, { shell: true, stdio: "pipe" });

  const formatLine = (data) => {
    return data
      .toString()
      .trim()
      .split("\n")
      .map(line => `\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}`)
      .join("\n");
  };

  child.stdout.on("data", (data) => {
    console.log(formatLine(data));
  });

  child.stderr.on("data", (data) => {
    console.error(`\x1b[31m[${prefix}-Error]\x1b[0m ${data.toString().trim()}`);
  });

  child.on("close", (code) => {
    console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m process exited with code ${code}`);
  });

  return child;
}

// NextJS color = 36 (cyan), Worker color = 35 (magenta)
const nextProcess = runCommand("npm", ["run", "dev", "--prefix", "apps/web-next"], "NextJS", "36");
const workerProcess = runCommand("npm", ["run", "dev", "--prefix", "apps/worker"], "Worker", "35");

const shutdown = () => {
  console.log("\n🛑 Shutting down concurrent processes...");
  nextProcess.kill("SIGINT");
  workerProcess.kill("SIGINT");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
