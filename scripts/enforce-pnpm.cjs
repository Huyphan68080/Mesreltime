const ua = process.env.npm_config_user_agent || "";

if (!ua.includes("pnpm")) {
  console.error("This repository uses pnpm workspaces.");
  console.error("Use: pnpm install");
  process.exit(1);
}
