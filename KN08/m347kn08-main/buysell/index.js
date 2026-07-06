const express = require("express");
const app = express();

// The account service is the only service that talks to the database.
// Its URL comes from an environment variable so the same image works in
// local dev, Docker Desktop, and Kubernetes (just change ACCOUNT_URL).
const ACCOUNT_URL = process.env.ACCOUNT_URL || "http://localhost:8080";
const PORT = process.env.PORT || 8002;

// The frontend sends "text/json", which is non-standard, so parse any body as JSON.
app.use(express.json({ type: () => true }));

// The browser calls this service directly (cross-origin), so allow CORS.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// --- helpers: thin wrappers around the account service ---
async function getHoldings(id) {
  const r = await fetch(`${ACCOUNT_URL}/Account/Cryptos?userId=${id}`);
  return await r.json(); // returns a plain number
}
async function addCrypto(id, amount) {
  await fetch(`${ACCOUNT_URL}/Account/AddCrypto?userId=${id}&amount=${amount}`, { method: "POST" });
}
async function removeCrypto(id, amount) {
  await fetch(`${ACCOUNT_URL}/Account/RemoveCrypto?userId=${id}&amount=${amount}`, { method: "POST" });
}

// health check
app.get("/", (req, res) => res.send("BuySell service running"));

// /buy: buy coins from the market and credit them to the user
app.post("/buy", async (req, res) => {
  try {
    const { id, amount } = req.body;
    if (!id || !amount || amount <= 0) return res.json(false);
    await addCrypto(id, amount);
    res.json(true);
  } catch (e) {
    console.error("buy failed:", e);
    res.json(false);
  }
});

// /sell: sell coins. A user can never sell more than they own; if they try,
// the total is simply set to 0 (i.e. we only remove what they actually have).
app.post("/sell", async (req, res) => {
  try {
    const { id, amount } = req.body;
    if (!id || !amount || amount <= 0) return res.json(false);
    const holdings = await getHoldings(id);
    const toRemove = Math.min(amount, holdings);
    await removeCrypto(id, toRemove);
    res.json(true);
  } catch (e) {
    console.error("sell failed:", e);
    res.json(false);
  }
});

app.listen(PORT, () => console.log(`BuySell on :${PORT}, account at ${ACCOUNT_URL}`));
