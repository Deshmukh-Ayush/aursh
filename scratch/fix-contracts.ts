import { db } from "../src/utils/db";
import { contract, signature, projectMember } from "../src/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

async function run() {
  console.log("Fixing contracts...");
  
  const allContracts = await db.select().from(contract);
  
  for (const c of allContracts) {
    const members = await db.select().from(projectMember).where(eq(projectMember.projectId, c.projectId));
    const signatures = await db.select().from(signature).where(eq(signature.contractId, c.id));
    
    const signatureUserIds = signatures.map(s => s.userId);
    
    let added = 0;
    for (const m of members) {
      if (!signatureUserIds.includes(m.userId)) {
        console.log(`Adding missing signature for user ${m.userId} in contract ${c.id}`);
        await db.insert(signature).values({
          id: crypto.randomUUID(),
          contractId: c.id,
          userId: m.userId,
        });
        added++;
      }
    }
    
    if (added > 0 && c.status === 'signed') {
      console.log(`Reverting contract ${c.id} to pending_signature since new signatures were added.`);
      await db.update(contract).set({ status: 'pending_signature' }).where(eq(contract.id, c.id));
    }
  }
  
  console.log("Done.");
  process.exit(0);
}

run().catch(console.error);
