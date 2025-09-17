import { pool } from './connection/pgsql.js'
import { selectTableDetenido } from './database/detenido.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { queryArtemis } from './utils/signature.js'

const IMAGES_DIR = path.join(process.cwd(), 'src', 'images_detenidos')
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png'])

const guessContentType = (p) => {
    const ext = path.extname(p).toLowerCase()
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
    if (ext === '.png') return 'image/png'
    return 'application/octet-stream'
}

function extractFolio(filename) {
    const base = filename.replace(/\.[^.]+$/, '')
    const faSplit = base.split(' - FA - ')
    if (faSplit.length >= 2) {
        const token = (faSplit[1].split(' - ')[0] || '').trim()
        const digits = token.match(/^\d+$/)?.[0]
        if (digits) return digits
    }
    const cand = Array.from(base.matchAll(/\b(\d{5,})\b/g)).map(m => m[1])
    if (cand.length) {
        cand.sort((a, b) => b.length - a.length)
        return cand[0]
    }
    return null
}

async function buildFolioIndex(dir) {
    const index = new Map()
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const e of entries) {
        if (!e.isFile()) continue
        const ext = path.extname(e.name).toLowerCase()
        if (!IMAGE_EXTS.has(ext)) continue
        const folio = extractFolio(e.name)
        if (!folio) continue
        const full = path.join(dir, e.name)
        index.set(String(folio), { path: full, contentType: guessContentType(full) })
    }
    return index
}

async function fileToBase64(p) {
    const buf = await fs.readFile(p)
    return buf.toString('base64')
}

async function main() {
    const client = await pool.connect()
    try {
        const detenidos = await selectTableDetenido(client)
        const folioIndex = await buildFolioIndex(IMAGES_DIR)

        for (const d of detenidos) {
            let faceData = null

            if (d.sfolio) {
                const hit = folioIndex.get(String(d.sfolio))
                if (hit) {
                    faceData = await fileToBase64(hit.path)
                } else {
                    console.warn(`No se encontró foto para folio ${d.sfolio}`)
                }
            }

            const personFamilyName = `${d.sapellidopaterno ?? ''} ${d.sapellidomaterno ?? ''}`.trim()
            const personGivenName = d.snombre
            const gender = d.ssexo === 'M' ? 1 : 2

            const payloadPersonAdd = {
                personCode: String(d.iiddetenido).padStart(7, '0'),
                personFamilyName,
                personGivenName,
                gender,
                orgIndexCode: '67',
                phoneNo: '',
                email: '',
                faces: faceData ? [{ faceData }] : []
            }

            const dataPersonAdd = await queryArtemis(
                'POST',
                '/artemis/api/resource/v1/person/single/add',
                payloadPersonAdd
            )

            if (dataPersonAdd.code !== '0') {
                throw new Error(`Artemis error: ${dataPersonAdd.msg}`)
            }

            console.log(`Persona agregada: ${dataPersonAdd.data}`)

            if (faceData) {
                const payloadFaceAddition = {
                    personIndexCode: dataPersonAdd.data,
                    faceGroupIndexCode: '27',
                    faceInfo: {
                        personGivenName,
                        personFamilyName,
                        sex: gender
                    },
                    facePic: {
                        faceBinaryData: faceData
                    }
                }

                const dataFaceAddition = await queryArtemis(
                    'POST',
                    '/artemis/api/frs/v1/face/single/addition',
                    payloadFaceAddition
                )

                if (dataFaceAddition.code !== '0') {
                    throw new Error(`Face addition error: ${dataFaceAddition.msg}`)
                }

                console.log(`Foto agregada a persona ${dataPersonAdd.data}`)
            }
        }
    } finally {
        client.release()
    }
}

main().catch(err => { console.error(err); process.exit(1) })