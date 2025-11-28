import { crearCliente, obtenerCliente, listarClientes, actualizarCliente, eliminarCliente } from "../utils/dynamo.js";
import { generarID } from "../utils/id.js";

const CAMPOS_CLIENTE = ["id","razonSocial", "nombreComercial", "rfc", "email", "telefono"];

const crearID = () => 'cli-' + generarID();

const validarClientePost = (body) => {
  const errores = [];
  if (!body) return ["Body no puede estar vacío"];
  CAMPOS_CLIENTE.forEach(campo => {
    if (!body[campo]) errores.push(`El campo '${campo}' es requerido`);
  });
  if (body.email && !/\S+@\S+\.\S+/.test(body.email)) errores.push("El campo 'email' no es válido");
  if (body.rfc && body.rfc.length < 10) errores.push("El campo 'rfc' parece incorrecto");
  return errores;
};

const CAMPOS_CLIENTE_Update = ["razonSocial", "nombreComercial", "rfc", "email", "telefono"];
const validarClientePut = (body) => {
  const errores = [];
  if (!body || Object.keys(body).length === 0) return ["Debe enviar al menos un campo para actualizar"];
  return errores;
};

export const clientesHandler = async (event) => {
    const method = event.httpMethod || event.requestContext?.http?.method;
    const id = event.pathParameters?.id;
    const body = event.body ? JSON.parse(event.body) : null;

    switch (method) {
        case "POST": {
            body.id = crearID();
            const errores = validarClientePost(body);
            if (errores.length) return { statusCode: 400, body: JSON.stringify({ errores }) };
            const nuevoCliente = await crearCliente(body);
            return { statusCode: 201, body: JSON.stringify(nuevoCliente) };
        }
        case "GET":
            if (id) {
                const cliente = await obtenerCliente(id);
                return cliente ? { statusCode: 200, body: JSON.stringify(cliente) } : { statusCode: 404, body: "Cliente no encontrado" };
            } else {
                const list = await listarClientes();
                return { statusCode: 200, body: JSON.stringify(list) };
            }
        case "PUT": {
            if (!id) return { statusCode: 400, body: "ID requerido" };
            const errores = validarClientePut(body);
            if (errores.length) return { statusCode: 400, body: JSON.stringify({ errores }) };
            const actualizado = await actualizarCliente(id, body);
            return { statusCode: 200, body: JSON.stringify(actualizado) };
        }
        case "DELETE":
            if (!id) return { statusCode: 400, body: "ID requerido" };
            await eliminarCliente(id);
            return { statusCode: 204, body: "Cliente eliminado" };
        default:
            return { statusCode: 405, body: "Método no permitido" };
    }
};