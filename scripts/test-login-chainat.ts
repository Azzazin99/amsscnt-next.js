import "dotenv/config";
import { verifyLogin } from "../src/lib/auth/verify-login";

async function testLogin() {
  const result = await verifyLogin({
    username: "1619900107791",
    password: "7791",
  });
  console.log("Login result:", JSON.stringify(result, null, 2));
  process.exit(0);
}

testLogin().catch(console.error);
