import { readFile } from "node:fs/promises";

const packagingPath = new URL("../../docs/mobile/packaging.md", import.meta.url);
const nfcGuidePath = new URL("../../docs/mobile/nfc-testing.md", import.meta.url);

const requiredSections = ["## Android Instrumentation Tests", "## iOS Manual QA Checklist"];

async function main() {
  const packaging = await readFile(packagingPath, "utf8");
  for (const section of requiredSections) {
    if (!packaging.includes(section)) {
      console.error(`Missing section in packaging guide: ${section}`);
      process.exitCode = 1;
      return;
    }
  }

  try {
    await readFile(nfcGuidePath, "utf8");
  } catch (error) {
    console.error("NFC testing guide is missing", error);
    process.exitCode = 1;
    return;
  }

  console.log("Mobile QA documentation verified.");
}

main().catch((error) => {
  console.error("Failed to verify mobile QA documentation", error);
  process.exitCode = 1;
});
