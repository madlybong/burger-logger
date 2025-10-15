import { execSync } from "child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

// Lock file path
const lockFilePath = join(process.cwd(), ".publish-lock");

// Guard with lock file to prevent recursion
if (existsSync(lockFilePath)) {
  console.error("Publish already in progress, exiting.");
  process.exit(1);
}
writeFileSync(lockFilePath, "locked");

// Existing guard for process-level recursion
const isPublishing = process.env.IS_PUBLISHING;
if (isPublishing) {
  console.error("Recursive publish detected, exiting.");
  unlinkSync(lockFilePath);
  process.exit(1);
}
process.env.IS_PUBLISHING = "true";

const packageJsonPath = join(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

// Bump version (patch by default)
const newVersion = packageJson.version
  .split(".")
  .map((num: string, index: number) => {
    return index === 2 ? (parseInt(num) + 1).toString() : num;
  })
  .join(".");
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Run tests and build
console.log("Running tests...");
execSync(
  "bun test ./tests/logger.test.ts ./tests/middleware.test.ts --coverage",
  { stdio: "inherit" }
);
console.log("Running typecheck...");
execSync("bun run typecheck", { stdio: "inherit" });
console.log("Building...");
execSync("bun run build", { stdio: "inherit" });

// Commit version bump
console.log("Committing version change...");
execSync(`git add ${packageJsonPath}`, { stdio: "inherit" });
execSync(`git commit -m "Bump version to ${newVersion}"`, { stdio: "inherit" });

// Publish to npm (bypass lifecycle hooks by using direct command)
console.log("Publishing to npm...");
execSync("npm publish --access public", { stdio: "inherit" }); // Use npx to run npm publish directly

// Push to git
console.log("Pushing to git...");
execSync(`git push`, { stdio: "inherit" });
execSync(`git push origin v${newVersion}`, { stdio: "inherit" });

console.log(`Successfully published @astrake/burger-logger@${newVersion}`);

// Clean up
unlinkSync(lockFilePath);
delete process.env.IS_PUBLISHING;
