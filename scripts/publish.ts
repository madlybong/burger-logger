// scripts/publish.ts
import { execSync } from "child_process";
import {
  readFileSync,
  writeFileSync,
  unlinkSync,
  existsSync,
  statSync,
} from "fs";
import { join, resolve } from "path";

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

/**
 * Verify that the package to be published contains the required dist files.
 * Strategy:
 * 1) Try `npm pack --dry-run` and scan stdout.
 * 2) If step 1 doesn't work or doesn't list files, fallback to `npm pack`,
 *    create a tarball and inspect with `tar -tzf <tarball>`.
 */
function verifyPackageContainsDist(): void {
  const requiredFiles = ["dist/index.js", "dist/index.d.ts"];
  console.log("Verifying package contents via `npm pack --dry-run`...");

  try {
    // Try dry-run first (prints list of files that would be packed)
    const dryRunOutput = execSync("npm pack --dry-run", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).toString();

    // Some npm versions print a header line; perform a simple substring check.
    const ok = requiredFiles.every((f) => dryRunOutput.includes(f));
    if (ok) {
      console.log("`npm pack --dry-run` verification passed.");
      return;
    } else {
      console.warn(
        "`npm pack --dry-run` did not list all required files. Falling back to creating a tarball for inspection..."
      );
    }
  } catch (err) {
    console.warn(
      "`npm pack --dry-run` failed or is not supported in this environment. Falling back to creating a tarball..."
    );
  }

  // Fallback: create a real tarball with `npm pack` and inspect it.
  let tarballName = "";
  try {
    tarballName = execSync("npm pack", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .toString()
      .trim();
    if (!tarballName) throw new Error("npm pack did not emit a tarball name.");
    const tarballPath = resolve(process.cwd(), tarballName);
    console.log("Created tarball:", tarballName);

    try {
      // Try to list tarball contents using tar (common on macOS, Linux, WSL; may not exist on plain Windows)
      const tarList = execSync(`tar -tzf ${tarballPath}`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }).toString();

      const ok = requiredFiles.every((f) => tarList.includes(f));
      // Clean up tarball
      try {
        if (existsSync(tarballPath)) unlinkSync(tarballPath);
      } catch (_) {}

      if (!ok) {
        throw new Error(
          `Pack verification failed: required files ${requiredFiles.join(
            ", "
          )} not found inside ${tarballName}.`
        );
      }

      console.log("Tarball inspection passed: required dist files present.");
      return;
    } catch (tarErr) {
      // If tar command is not available or fails, we can't inspect automatically.
      // Clean up tarball and instruct the user to inspect manually.
      try {
        if (existsSync(tarballPath)) unlinkSync(tarballPath);
      } catch (_) {}

      throw new Error(
        "Could not inspect the created tarball automatically (tar command failed or not available). " +
          "Please ensure `dist/index.js` and `dist/index.d.ts` are present before publishing. " +
          `You can run 'npm pack' locally and inspect the generated ${tarballName} or run 'npm pack --dry-run'.`
      );
    }
  } catch (err: any) {
    throw new Error(`Package verification step failed: ${err.message ?? err}`);
  }
}

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

  // quick local sanity: ensure dist exists before trying to pack
  const distIndex = join(process.cwd(), "dist", "index.js");
  const distDts = join(process.cwd(), "dist", "index.d.ts");
  if (!existsSync(distIndex) || !existsSync(distDts)) {
    console.error(
      `Expected build outputs missing. Make sure both files exist:\n - ${distIndex}\n - ${distDts}\n\n` +
        "Aborting publish. Run `bun run build` and ensure your tsconfig `outDir` points to `dist/`."
    );
    process.exit(1);
  }

  console.log("Committing version change...");
  execSync(`git add ${packageJsonPath}`, { stdio: "inherit" });
  execSync(`git commit -m "Bump version to ${newVersion}"`, {
    stdio: "inherit",
  });

  // Verify package contents (checks include dist files)
  verifyPackageContainsDist();

  console.log("Publishing to npm (ignoring lifecycle scripts)...");
  // IMPORTANT: --ignore-scripts prevents npm from invoking the 'publish' lifecycle (which would recurse)
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
