/**
 * One-off testnet seed for QA: mints a sandbox NFT (with a real
 * cluster of blocks) AND a lessons NFT for a deterministic test
 * keypair, so we can visit /town/<address>, fire the Tour, and watch
 * the gallery + leaderboard pick it up.
 *
 * Usage:
 *   node scripts/seed-testnet.cjs           — fund + mint both NFTs
 *   node scripts/seed-testnet.cjs --address — print address only
 *
 * Secret is stored at .env (TEST_SEED_HEX) on first run so reruns
 * don't burn the faucet.
 */

const fs = require('fs');
const path = require('path');
const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui/client');
const { Transaction } = require('@mysten/sui/transactions');

const ENV_PATH = path.resolve(__dirname, '..', '.env');
const PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';
const PACKAGE_ID = readEnv('VITE_WORLD_NFT_PACKAGE_ID') || readEnv('PACKAGE_ID');
if (!PACKAGE_ID) {
  console.error('Missing VITE_WORLD_NFT_PACKAGE_ID in .env');
  process.exit(1);
}

function readEnv(key) {
  if (!fs.existsSync(ENV_PATH)) return null;
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
  for (const l of lines) {
    const m = l.match(new RegExp(`^${key}=(.*)$`));
    if (m) return m[1].trim();
  }
  return null;
}

function writeEnv(key, value) {
  let txt = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
  if (new RegExp(`^${key}=`, 'm').test(txt)) {
    txt = txt.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
  } else {
    if (!txt.endsWith('\n')) txt += '\n';
    txt += `${key}=${value}\n`;
  }
  fs.writeFileSync(ENV_PATH, txt);
}

function getOrCreateKeypair() {
  let hex = readEnv('TEST_SEED_HEX');
  if (!hex) {
    const kp = Ed25519Keypair.generate();
    // Persist the 32-byte secret as hex so reruns can recover it
    const secret = kp.getSecretKey(); // suiprivkey1... bech32
    writeEnv('TEST_SEED_HEX', secret);
    return kp;
  }
  return Ed25519Keypair.fromSecretKey(hex);
}

async function fundIfNeeded(client, address) {
  const balance = await client.getBalance({ owner: address });
  const sui = Number(balance.totalBalance) / 1e9;
  console.log(`  balance: ${sui.toFixed(3)} SUI`);
  if (sui >= 0.1) return;

  console.log('  requesting faucet…');
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch('https://faucet.testnet.sui.io/v1/gas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ FixedAmountRequest: { recipient: address } }),
    });
    if (res.ok) {
      console.log('  faucet ok');
      await sleep(4000);
      return;
    }
    const wait = 2000 * Math.pow(2, attempt - 1);
    console.log(`  faucet ${res.status}, retry in ${wait}ms`);
    await sleep(wait);
  }
  throw new Error('Faucet kept failing — try again later');
}

async function uploadWalrus(bytes) {
  const url = `${PUBLISHER}/v1/blobs?epochs=5`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': 'application/octet-stream' },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Walrus ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const blobId =
    json.newlyCreated?.blobObject?.blobId ?? json.alreadyCertified?.blobId;
  if (!blobId) throw new Error('Walrus returned no blobId');
  return { blobId, uri: `walrus://${blobId}` };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const enc = (s) => Array.from(new TextEncoder().encode(s));

function buildSandboxBlocks() {
  // A small mixed-use town: a wallet cluster, a DeFi vault row, a
  // governance pillar trio, and a zk centerpiece on a hill of timber.
  const blocks = [];
  const id = () => `b_${blocks.length}`;
  const place = (type, position) =>
    blocks.push({
      id: id(),
      type,
      position,
      rotation: [0, 0, 0],
      shape: 'cube',
      color: null,
    });

  // Wallet keystones — 2×2
  for (let x = -6; x <= -5; x++) for (let z = -1; z <= 0; z++) place('wallet_keystone', [x, 0, z]);

  // DeFi vault row (4 wide)
  for (let x = 2; x <= 5; x++) place('defi_vault', [x, 0, -2]);
  for (let x = 2; x <= 5; x++) place('defi_vault', [x, 1, -2]);

  // Governance marble pillars
  for (let y = 0; y <= 3; y++) place('governance_marble', [0, y, 4]);
  for (let y = 0; y <= 2; y++) place('governance_marble', [2, y, 4]);
  for (let y = 0; y <= 2; y++) place('governance_marble', [-2, y, 4]);

  // Timber hill
  for (let x = -1; x <= 1; x++) for (let z = -5; z <= -3; z++) place('timber', [x, 0, z]);
  for (let x = -1; x <= 1; x++) place('timber', [x, 1, -4]);
  place('zk_crystal', [0, 2, -4]); // centerpiece

  // A short road
  for (let x = -3; x <= 6; x++) place('road', [x, 0, 2]);

  // A couple of streetlights
  place('streetlight', [-2, 0, 1]);
  place('streetlight', [3, 0, 1]);

  return blocks;
}

function buildLessonsBlocks() {
  // The "Crypto 101" town — represents each of the six lesson districts.
  const blocks = [];
  const place = (type, x, y, z) =>
    blocks.push({
      id: `l_${blocks.length}`,
      type,
      position: [x, y, z],
      rotation: [0, 0, 0],
      shape: 'cube',
      color: null,
    });

  // Wallets district
  place('wallet_keystone', -5, 0, -2);
  place('wallet_keystone', -4, 0, -2);
  place('wallet_keystone', -5, 0, -1);
  place('wallet_keystone', -4, 0, -1);
  // Tokens
  place('token_prism', -1, 0, -2);
  place('token_prism', 0, 0, -2);
  place('token_prism', 1, 0, -2);
  place('token_prism', 0, 1, -2);
  // Smart contracts (tall obelisks)
  place('contract_obelisk', 4, 0, -2);
  place('contract_obelisk', 4, 1, -2);
  place('contract_obelisk', 4, 2, -2);
  place('contract_obelisk', 4, 3, -2);
  // Validators
  place('security_bunker', -5, 0, 2);
  place('security_bunker', -4, 0, 2);
  place('security_bunker', -5, 0, 3);
  place('security_bunker', -4, 0, 3);
  // ZK (centerpiece crystal)
  place('zk_crystal', 0, 0, 3);
  place('zk_crystal', 0, 1, 3);
  // DeFi (vault row)
  place('defi_vault', 3, 0, 3);
  place('defi_vault', 4, 0, 3);
  place('defi_vault', 3, 1, 3);
  place('defi_vault', 4, 1, 3);

  return blocks;
}

async function mint(client, signer, blocks, kind, displayName) {
  const payload = { blocks, kind, version: 1, savedAt: Date.now() };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  console.log(`  uploading ${blocks.length} blocks (${bytes.length} bytes) to Walrus…`);
  const blob = await uploadWalrus(bytes);
  console.log(`  blob: ${blob.blobId}`);

  const prefix = kind === 'lessons' ? 'L:' : 'S:';
  const name = `${prefix}${displayName}`;
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::world::mint_world`,
    arguments: [
      tx.pure.vector('u8', enc(name)),
      tx.pure.vector('u8', enc(blob.uri)),
      tx.pure.u64(blocks.length),
    ],
  });
  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer,
    options: { showEffects: true },
  });
  console.log(`  tx: ${result.digest}`);
  return result.digest;
}

(async () => {
  const onlyAddress = process.argv.includes('--address');
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });
  const kp = getOrCreateKeypair();
  const address = kp.toSuiAddress();

  if (onlyAddress) {
    console.log(address);
    return;
  }

  console.log(`Test wallet: ${address}`);

  await fundIfNeeded(client, address);

  // Check what's already minted under this wallet so we don't double-spam
  const owned = await client.getOwnedObjects({
    owner: address,
    filter: { StructType: `${PACKAGE_ID}::world::World` },
    options: { showContent: true },
    limit: 25,
  });
  const names = owned.data
    .map((o) => o.data?.content?.dataType === 'moveObject' && o.data.content.fields?.name)
    .filter(Boolean);
  console.log(`  existing worlds: ${names.length ? names.join(', ') : '(none)'}`);

  const hasSandbox = names.some((n) => String(n).startsWith('S:'));
  const hasLessons = names.some((n) => String(n).startsWith('L:'));

  if (!hasSandbox) {
    console.log('\nMinting Sandbox NFT…');
    await mint(client, kp, buildSandboxBlocks(), 'sandbox', 'Test Sandbox Town');
  } else {
    console.log('\nSandbox already minted, skipping');
  }

  if (!hasLessons) {
    console.log('\nMinting Lessons NFT…');
    await mint(client, kp, buildLessonsBlocks(), 'lessons', 'Crypto 101');
  } else {
    console.log('\nLessons already minted, skipping');
  }

  console.log(`\nDone. Visit /town/${address}`);
})().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
