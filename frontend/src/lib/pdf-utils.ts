// Helper functions for PDF verification

export function publicKeyInfoToPEM(spkiBuffer: ArrayBuffer): string {
    const b64 = window.btoa(
        String.fromCharCode.apply(null, Array.from(new Uint8Array(spkiBuffer)))
    );
    const lines = b64.match(/.{1,64}/g) || [];
    return [
        "-----BEGIN PUBLIC KEY-----",
        ...lines,
        "-----END PUBLIC KEY-----"
    ].join("\n");
}

export function initPKIjs() {
    try {
        // We need to install pkijs first for this to work
        // This is just a placeholder for the actual implementation
        if ((window as any).__PKIJS_ENGINE_INITIALIZED__) return;

        const crypto = window.crypto;
        // setEngine(
        //   "browser_crypto",
        //   crypto as any,
        //   new CryptoEngine({
        //     name: "browser_crypto",
        //     crypto: crypto as any,
        //     subtle: (crypto as any).subtle,
        //   })
        // );

        (window as any).__PKIJS_ENGINE_INITIALIZED__ = true;
        console.log("PKIjs initialized");
    } catch (error) {
        console.error("Failed to initialize PKIjs:", error);
    }
}
