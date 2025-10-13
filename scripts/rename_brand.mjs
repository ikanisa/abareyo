import fs from "fs";
import path from "path";

/**
 * Replace all occurrences of specified strings in a file.
 * Only run on safe file types (.ts, .tsx, .js, .jsx, .css, .md, .json).
 */
function replaceInFile(filepath, patterns) {
  let content = fs.readFileSync(filepath, "utf8");
  let modified = content;

  // Specific phrase for the install prompt
  modified = modified.replace(/Install Abareyo\\?/g, "Install GIKUNDIRO App?");

  // General replacements (case-sensitive and lowercase)
  patterns.forEach(({ from, to }) => {
    modified = modified.split(from).join(to);
  });

  if (modified !== content) {
    fs.writeFileSync(filepath, modified, "utf8");
    console.log("Updated:", filepath);
  }
}

/**
 * Recursively walk through directories and process each file.
 * Skips node_modules, .git, build output folders, etc.
 */
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (["node_modules", ".git", ".next", "out", "coverage"].includes(entry.name)) {
        continue;
      }
      walkDir(path.join(dir, entry.name));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      const allowed = [".ts", ".tsx", ".js", ".jsx", ".css", ".md", ".json"];
      if (allowed.includes(ext)) {
        const fullpath = path.join(dir, entry.name);
        replaceInFile(fullpath, [
          { from: "Abareyo", to: "GIKUNDIRO" },
          { from: "abareyo", to: "gikundiro" }
        ]);
      }
    }
  }
}

walkDir(".");
console.log("Done replacing branding strings.");
