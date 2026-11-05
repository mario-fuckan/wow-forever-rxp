import { readFile, writeFile } from "node:fs/promises"
import { inflateSync } from "node:zlib"
import A32 from "adler-32"
import { getSBox } from "./shared.ts"

const loadImportBuffer = (value: string) => {
    const buffer: string[] = []

    for (const [_, hash, mode, content] of value.matchAll(/(-?\d+)(\D)([A-Za-z0-9+/=]+)%/g)) {
        const data = checkDataIntegrity(content, Number(hash), mode.charCodeAt(0))!

        for (const piece of data.toString("utf-8").split("\0")) {
            buffer.push(piece)
        }
    }

    return buffer
}

const checkDataIntegrity = (content: string, hash: number, mode: number) => {
    if (mode !== 58) return

    const S = getSBox("player#1234")
    const decoded = Buffer.from(content, "base64")
    const compressed = Buffer.alloc(decoded.length)

    let i = 0
    let j = 0

    for (let k = 0; k < decoded.length; k++) {
        i = (i + 1) & 0xff
        j = (j + S[i]) & 0xff

        const temp = S[i]
        S[i] = S[j]
        S[j] = temp

        compressed[k] = decoded[k] ^ S[(S[i] + S[j]) & 0xff]
    }

    const decompressed = inflateSync(compressed)

    const checksum = A32.buf(decompressed) >>> 0

    if (hash >>> 0 !== checksum) throw new Error("An error occurred.")

    return decompressed
}

let text = await readFile("./src/guides/wow_forever_player.txt", "utf-8")

text = text.replace(/^\D+/, "").replace(/\D+$/, "")

const guide = loadImportBuffer(text)

await writeFile("./src/guides/wow_forever_raw.txt", guide.join("\0"), "utf-8")