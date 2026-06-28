
import { db } from "./server/db";
import { users } from "./shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function resetPasswords() {
  console.log("Resetting all passwords to Gauranitai@2026 using bcryptjs...");
  const hashedPassword = await bcrypt.hash("Gauranitai@2026", 10);
  
  const allUsers = await db.select().from(users);
  for (const user of allUsers) {
    await db.update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.id, user.id));
    console.log(`Updated password for ${user.email}`);
  }
  console.log("All passwords reset successfully!");
}

resetPasswords().catch(console.error);
