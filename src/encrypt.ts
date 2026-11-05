import { readFile, writeFile } from "node:fs/promises"
import A32 from "adler-32"
import { deflateSync } from "node:zlib"
import { getSBox } from "./shared.ts"

const guide = await readFile("./src/guides/wow_forever_raw.txt", "utf-8")

const raw = Buffer.from(guide, "utf-8")
const h1 = A32.buf(raw) >>> 0
const zlib_buffer = deflateSync(raw)

const S = getSBox("player#1234")
const encrypted = new Uint8Array(zlib_buffer.length)

let i = 0
let j = 0

for (let k = 0; k < encrypted.length; k++) {
    i = (i + 1) & 0xff
    j = (j + S[i]) & 0xff

    const temp = S[i]
    S[i] = S[j]
    S[j] = temp

    encrypted[k] = zlib_buffer[k] ^ S[(S[i] + S[j]) & 0xff]
}

const b64 = Buffer.from(encrypted).toString("base64")
const nGuides = guide.split("\0").length

const importString = `${nGuides}|${h1}:${b64}%|40000`

await writeFile("./src/guides/wow_forever_player.txt", importString, "utf-8")