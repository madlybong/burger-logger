import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const packageJsonPath = join(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

// Bump version (patch by default, can be modified for minor/major)
const newVersion = packageJson.version
  .split(".")
  .map((num: string, index: number) => {
    return index === 2 ? (parseInt(num) + 1).toString() : num;
  })
  .join(".");
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Run tests and build
execSync("bun run test", { stdio: "inherit" });
execSync("bun run build", { stdio: "inherit" });

// Commit version bump
execSync(`git add ${packageJsonPath}`, { stdio: "inherit" });
execSync(`git commit -m "Bump version to ${newVersion}"`, { stdio: "inherit" });

// Publish to npm
execSync("npm publish --access public", { stdio: "inherit" });

// Push to git
execSync(`git push`, { stdio: "inherit" });
execSync(`git push origin v${newVersion}`, { stdio: "inherit" });

console.log(`Successfully published @astrake/burger-logger@${newVersion}`);
