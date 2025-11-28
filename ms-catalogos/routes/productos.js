import { crearProducto, obtenerProducto, listarProductos, actualizarProducto, eliminarProducto } from "../utils/dynamo.js";
import { generarID } from "../utils/id.js";

const CAMPOS_PRODUCTO = ["id", "nombre", "unidadMedida", "precioBase"];
const crearID = () => 'prod-' + generarID();

const validarProductoPost = (body) => {
    const errores = [];
    if (!body) return ["Body vacio"];
    ["id", "nombre", "unidadMedida", "precioBase"].forEach(campo => {
        if (!body[campo]) errores.push(`Requerido: ${campo}`);
    });
    return errores;
};

export const productosHandler = async (event) => {
    const method = event.httpMethod || event.requestContext?.http?.method;
    const id = event.pathParameters?.id;
    const body = event.body ? JSON.parse(event.body) : null;

    switch (method) {
        case "POST": {
            body.id = crearID();
            const errores = validarProductoPost(body);
            if (errores.length) return { statusCode: 400, body: JSON.stringify({ errores }) };
            const nuevo = await crearProducto(body);
            return { statusCode: 201, body: JSON.stringify(nuevo) };
        }
        case "GET":
            if (id) {
                const prod = await obtenerProducto(id);
                return prod ? { statusCode: 200, body: JSON.stringify(prod) } : { statusCode: 404, body: "No encontrado" };
            }
            const list = await listarProductos();
            return { statusCode: 200, body: JSON.stringify(list) };
        case "PUT": {
             if (!id) return { statusCode: 400, body: "ID requerido" };
             const act = await actualizarProducto(id, body);
             return { statusCode: 200, body: JSON.stringify(act) };
        }
        case "DELETE":
             if (!id) return { statusCode: 400, body: "ID requerido" };
             await eliminarProducto(id);
             return { statusCode: 204, body: "" };
        default: return { statusCode: 405, body: "Metodo no permitido" };
    }
};