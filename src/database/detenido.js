export async function selectTableDetenido(client) {
    const query = `
        SELECT
            d.iiddetenido,
            d.snombre,
            d.sapellidopaterno,
            d.sapellidomaterno,
            d.snombrenormalizado,
            d.irepeticiones,
            d.salias,
            d.ssexo,
            d.dtfecha AS fecha_registro,

            dd.iiddetalledetencion,
            dd.sremision,
            dd.dtfecha AS fecha_detencion,
            dd.shora,
            dd.stipoevento,
            dd.sfundamento,
            dd.sconsistente,
            dd.saliasdetencion,
            dd.iedad,
            dd.sgradoestudio,
            dd.socupacion,
            dd.scalle,
            dd.scolonia,
            dd.sciudad_municipio,

            i.iidimagen,
            i.sfolio,
            i.sruta
        FROM public.tdetenido d
        INNER JOIN public.tdetalledetencion dd
            ON d.iiddetenido = dd.iiddetenido
        LEFT JOIN public.timagenes i
            ON dd.iiddetalledetencion = i.iiddetalledetencion;
    `

    const data = await client.query(query)

    return data.rows
}