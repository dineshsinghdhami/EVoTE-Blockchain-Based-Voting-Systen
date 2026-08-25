const fs = require("fs");
const path = require("path");

const srcRoot = path.join(__dirname, "frontend", "src");
const configFile = path.join(srcRoot, "config.js");

function getFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getFiles(full);
    }

    if (entry.isFile() && [".js", ".jsx"].includes(path.extname(entry.name))) {
      return [full];
    }

    return [];
  });
}

for (const file of getFiles(srcRoot)) {
  if (file === configFile) continue;

  let content = fs.readFileSync(file, "utf8");

  if (!content.includes("http://127.0.0.1:8000")) {
    continue;
  }

  console.log("Fixing:", path.relative(__dirname, file));

  content = content.replace(
    /(["'])http:\/\/127\.0\.0\.1:8000([^"']*)\1/g,
    (_match, _quote, suffix) => `\`\${API_URL}${suffix}\``
  );

  content = content.replace(
    /http:\/\/127\.0\.0\.1:8000/g,
    "${API_URL}"
  );

  const alreadyHasApiUrl =
    /import\s+API_URL\s+from/.test(content) ||
    /import\s*\{[^}]*API_URL[^}]*\}\s*from/.test(content) ||
    /(const|let|var)\s+API_URL\s*=/.test(content);

  if (!alreadyHasApiUrl) {
    let relative = path.relative(path.dirname(file), configFile);
    relative = relative.replace(/\\/g, "/").replace(/\.js$/, "");

    if (!relative.startsWith(".")) {
      relative = "./" + relative;
    }

    content = `import { API_URL } from "${relative}";\n${content}`;
  }

  fs.writeFileSync(file, content, "utf8");
}

console.log("\nAPI URL cleanup finished.");