const LOCAL_ADMIN_PASSWORD_HASH = '82fefd3cedae87b0c84dbe635019a8dd01a7d879dbf374a3f0398211c4e913d8';

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyLocalAdminPassword(password) {
  return (await sha256(password)) === LOCAL_ADMIN_PASSWORD_HASH;
}
