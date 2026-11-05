export const getSBox = (username: string): Uint8Array<ArrayBuffer> => {
    username = username.toLowerCase()
    let bytes = new TextEncoder().encode(username)

    if (bytes.length > 16) {
        bytes = bytes.slice(bytes.length - 16)
    }

    const k = 16 - bytes.length
    const buffer = new Uint8Array(16)

    for (let i = 0; i < 16; i++) {
        let j = (i - k) & 0xf

        if (j < bytes.length) buffer[i] = bytes[j]
    }

    for (let i = 0; i < 16; i++) {
        buffer[-i & 0xf] =
            buffer[(15 - i) & 0xf] ^
            buffer[(13 - i) & 0xf] ^
            buffer[(12 - i) & 0xf] ^
            buffer[(10 - i) & 0xf]
    }

    const S = new Uint8Array(256)

    for (let i = 0; i < 256; i++) S[i] = i

    let j = 0

    for (let i = 0; i < 256; i++) {
        j = (j + S[i] + buffer[i % buffer.length]) & 0xff
        ;[S[i], S[j]] = [S[j], S[i]]
    }

    return S
}