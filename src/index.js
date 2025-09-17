import { pool } from './connection/pgsql.js'
import { selectTableDetenido } from './database/detenido.js'
import { queryArtemis } from './utils/signature.js'



async function main() {
    const client = await pool.connect()

    const detenidos = await selectTableDetenido(client)

    for (const detenido of detenidos) {
        const payloadPersonAdd = {
            // personCode,
            personFamilyName: `${detenido.sapellidopaterno} ${detenido.sapellidomaterno}`,
            personGivenName: detenido.snombre,
            gender: detenido.ssexo == 'M' ? 1 : 2,
            orgIndexCode: '67',
            phoneNo: '',
            email: '',
            faces: [{
                faceData
            }]
        }
    }

    // const dataPersonAdd = await queryArtemis('POST', '/artemis/api/resource/v1/person/single/add', payloadPersonAdd)
    // if (dataPersonAdd.code != '0') throw new Error(`Artemis error: ${dataPersonAdd.msg}`)

    // const payloadFaceAddition = {
    //     personIndexCode: dataPersonAdd.data,
    //     faceGroupIndexCode: String(faceGroupIndexCode),
    //     faceInfo: {
    //         personGivenName,
    //         personFamilyName,
    //         sex: gender
    //     },
    //     facePic: {
    //         faceBinaryData: faceData
    //     }
    // }

    // const dataFaceAddition = await queryArtemis('POST', '/artemis/api/frs/v1/face/single/addition', payloadFaceAddition)
    // if (dataFaceAddition.code != '0') throw new Error(`Face addition error: ${dataFaceAddition.msg}`)
}