const express = require("express");
const app = express();

const ACCOUNT_URL = process.env.ACCOUNT_URL || "http://localhost:8080";
const PORT = process.env.PORT || 8003;

app.use(express.json({ type: () => true }));

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
  return await r.json();
}
async function getFriends(id) {
  const r = await fetch(`${ACCOUNT_URL}/Account/Friends?userId=${id}`);
  return await r.json(); // [{ id, name }]
}
async function addCrypto(id, amount) {
  await fetch(`${ACCOUNT_URL}/Account/AddCrypto?userId=${id}&amount=${amount}`, { method: "POST" });
}
async function removeCrypto(id, amount) {
  await fetch(`${ACCOUNT_URL}/Account/RemoveCrypto?userId=${id}&amount=${amount}`, { method: "POST" });
}

app.get("/", (req, res) => res.send("SendReceive service running"));

// /send: send coins to a friend. We check that (1) the receiver really is a
// friend of the sender and (2) the sender has enough coins, then move them:
// remove from the sender, add to the receiver.
app.post("/send", async (req, res) => {
  try {
    const { id, receiverId, amount } = req.body;
    if (!id || !receiverId || !amount || amount <= 0) return res.json(false);

    // 1. receiver must be in the sender's friend list
    const friends = await getFriends(id);
    const isFriend = friends.some((f) => f.id === Number(receiverId));
    if (!isFriend) return res.json(false);

    // 2. sender must have enough coins
    const holdings = await getHoldings(id);
    if (holdings < amount) return res.json(false);

    // 3. move the coins
    await removeCrypto(id, amount);
    await addCrypto(receiverId, amount);

    res.json(true);
  } catch (e) {
    console.error("send failed:", e);
    res.json(false);
  }
});

app.listen(PORT, () => console.log(`SendReceive on :${PORT}, account at ${ACCOUNT_URL}`));
