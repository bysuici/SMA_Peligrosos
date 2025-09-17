export async function selectTableDetenido(client) {
    const query = `
        SELECT
            d.iiddetenido,
            d.snombre,
            d.sapellidopaterno,
            d.sapellidomaterno,
            d.ssexo,
            dd.iiddetalledetencion,
            i.sfolio
        FROM public.tdetenido d
        JOIN public.tdetalledetencion dd
            ON dd.iiddetenido = d.iiddetenido
        LEFT JOIN public.timagenes i
            ON i.iiddetalledetencion = dd.iiddetalledetencion
        ORDER BY d.iiddetenido;
    `

    const data = await client.query(query)

    return data.rows
}