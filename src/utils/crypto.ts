let crypto: Crypto

try {
  crypto = require("crypto")
} catch {
  crypto =
    globalThis?.crypto ?? (globalThis?.msCrypto as unknown as Crypto) ?? {}
}

export default crypto
