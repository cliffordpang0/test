import { loadDataset } from "../src/data";
import { validateDataset } from "../src/validation";
const errors = validateDataset(loadDataset());
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  "Dataset valid: five markets, seven criteria, explicit demonstration assumptions; no fabricated sources.",
);
