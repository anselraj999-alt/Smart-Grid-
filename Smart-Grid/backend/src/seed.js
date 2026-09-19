import crypto from "node:crypto";
import { hashPassword } from "./security.js";

/** Creates the demo login from the original app (CUSTOMER001 / Demo@123) if it is missing. */
export async function ensureDemoCustomer(store) {
  if (store.findByUserId("CUSTOMER001")) return false;

  store.add({
    id: crypto.randomUUID(),
    userId: "CUSTOMER001",
    name: "Demo Customer",
    address: "123 Demo Street, Green City",
    email: "demo.customer@smartgrid.ai",
    phone: "9876543210",
    aadhaarLast4: "1234",
    passwordHash: await hashPassword("Demo@123"),
    createdAt: new Date().toISOString(),
  });
  return true;
}
