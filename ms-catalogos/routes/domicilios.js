import { crearDomicilio, obtenerDomicilio, listarDomicilios, actualizarDomicilio, eliminarDomicilio } from "../utils/dynamo.js";
import { generarID } from "../utils/id.js";

const crearID = () => 'dom-' + generarID();

export const domiciliosHandler = async (event) => {
    const method = event.httpMethod || event.requestContext?.http?.method;
    const id = event.pathParameters?.id;
    const body = event.body ? JSON.parse(event.body) : null;

    switch (method) {
        case "POST":
            body.id = crearID();
            const nuevo = await crearDomicilio(body);
            return { statusCode: 201, body: JSON.stringify(nuevo) };
        case "GET":
            if (id) {
                const dom = await obtenerDomicilio(id);
                return dom ? { statusCode: 200, body: JSON.stringify(dom) } : { statusCode: 404, body: "No encontrado" };
            }
            const list = await listarDomicilios();
            return { statusCode: 200, body: JSON.stringify(list) };
        case "PUT":
            if (!id) return { statusCode: 400 };
            const act = await actualizarDomicilio(id, body);
            return { statusCode: 200, body: JSON.stringify(act) };
        case "DELETE":
            if (!id) return { statusCode: 400 };
            await eliminarDomicilio(id);
            return { statusCode: 204, body: "" };
        default: return { statusCode: 405, body: "Error" };
    }
};