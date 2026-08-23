import { spawn } from "node:child_process";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function pushSchema() {
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    try {
      await run("npx", ["prisma", "db", "push", "--skip-generate"]);
      return;
    } catch {
      console.log(`WMS: waiting for Postgres (attempt ${attempt})`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
  throw new Error("Postgres did not become ready");
}

await pushSchema();
await run("npx", ["tsx", "prisma/seed.ts"]);
await run("npx", ["next", "start", "-p", "3090", "-H", "0.0.0.0"]);
