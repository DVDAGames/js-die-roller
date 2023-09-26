// Try to get the global crypto object
let crypto

if (typeof globalThis?.crypto !== 'undefined') {
  crypto = globalThis.crypto
} else if (globalThis?.msCrypto !== 'undefined') {
  crypto = globalThis.msCrypto as unknown as Crypto
}

export default crypto
