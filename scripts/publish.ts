import { execSync } from "child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const lockFilePath = join(process.cwd(), ".publish-lock");

// Prevent concurrent or recursive publishing
if (existsSync(lockFilePath)) {
  console.error("Publish already in progress, exiting.");
  process.exit(1);
}
writeFileSync(lockFilePath, "locked");

if (process.env.IS_PUBLISHING) {
  console.error("Recursive publish detected, exiting.");
  unlinkSync(lockFilePath);
  process.exit(1);
}
process.env.IS_PUBLISHING = "true";

const packageJsonPath = join(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

// Bump patch version automatically
const newVersion = packageJson.version
  .split(".")
  .map((num: string, index: number) =>
    index === 2 ? (parseInt(num) + 1).toString() : num
  )
  .join(".");
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

let succeeded = false;
try {
  console.log("Running tests...");
  execSync(
    "bun test ./tests/logger.test.ts ./tests/middleware.test.ts --coverage",
    {
      stdio: "inherit",
    }
  );

  console.log("Running typecheck...");
  execSync("bun run typecheck", { stdio: "inherit" });

  console.log("Building...");
  execSync("bun run build", { stdio: "inherit" });

  console.log("Committing version change...");
  execSync(`git add ${packageJsonPath}`, { stdio: "inherit" });
  execSync(`git commit -m "Bump version to ${newVersion}"`, {
    stdio: "inherit",
  });

  console.log("Publishing to npm (ignoring lifecycle scripts)...");
  // --ignore-scripts prevents npm from re-triggering this same script
  execSync("npm publish --access public --ignore-scripts", {
    stdio: "inherit",
  });

  console.log("Tagging and pushing to git...");
  execSync(`git tag v${newVersion}`, { stdio: "inherit" });
  execSync(`git push --follow-tags`, { stdio: "inherit" });

  console.log(`Successfully published @astrake/burger-logger@${newVersion}`);
  succeeded = true;
} catch (err) {
  console.error("Publish failed:", (err as any)?.message ?? err);
  process.exitCode = 1;
} finally {
  // Clean up lock file
  try {
    if (existsSync(lockFilePath)) unlinkSync(lockFilePath);
  } catch (e) {
    console.warn("Failed to remove lock file:", (e as any)?.message ?? e);
  }
  delete process.env.IS_PUBLISHING;
  if (!succeeded) {
    console.error("Publishing did not complete successfully.");
  }
}
