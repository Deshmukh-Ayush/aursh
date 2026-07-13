import { db } from "./src/utils/db";
import { contract, signature } from "./src/db/schema";

async function main() {
  console.log("Deleting all signatures...");
  await db.delete(signature);
  console.log("Deleting all contracts...");
  await db.delete(contract);
  console.log("Done! You can now upload a new contract.");
}

main().catch(console.error);
