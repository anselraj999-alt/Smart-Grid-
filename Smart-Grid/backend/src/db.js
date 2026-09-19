import fs from "node:fs";
import path from "node:path";

/**
 * A tiny JSON-file "database" for customer accounts.
 *
 * Everything here is synchronous, so a read-modify-write can never interleave with
 * another request inside this single Node process. To move to a real database later
 * (SQLite, PostgreSQL, MongoDB) keep these same four functions and swap the inside.
 */
export function createStore(filePath) {
  function load() {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return { customers: [] };
      throw new Error(`Could not read ${filePath}: ${error.message}`);
    }
  }

  function save(data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tempFile = `${filePath}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, filePath); // atomic swap: a crash can't leave a half-written file
  }

  const same = (a, b) => a.toLowerCase() === b.toLowerCase();

  return {
    findByUserId: (userId) => load().customers.find((c) => same(c.userId, userId)) ?? null,
    findByEmail: (email) => load().customers.find((c) => same(c.email, email)) ?? null,
    add(customer) {
      const data = load();
      data.customers.push(customer);
      save(data);
      return customer;
    },
    count: () => load().customers.length,
  };
}

/** The fields that are safe to send to the browser (never the password hash). */
export function toPublicCustomer(customer) {
  return {
    userId: customer.userId,
    name: customer.name,
    address: customer.address,
    email: customer.email,
    phone: customer.phone,
    aadhaarMasked: `XXXX-XXXX-${customer.aadhaarLast4}`,
  };
}
