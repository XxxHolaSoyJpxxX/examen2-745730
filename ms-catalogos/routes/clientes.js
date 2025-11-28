import {
	crearCliente,
	obtenerCliente,
	listarClientes,
	actualizarCliente,
	eliminarCliente,
	checkIfRfcOrEmailExists // <-- NUEVA IMPORTACIÓN
} from "../utils/dynamo.js";
import { generarID } from "../utils/id.js";
const CAMPOS_CLIENTE = ["id","razonSocial", "nombreComercial", "rfc", "email", "telefono"];

const crearID = () => {
  return 'cli-' + generarID();
}

const validarClientePost = (body) => {
  const errores = [];
  if (!body) return ["Body no puede estar vacío"];
  CAMPOS_CLIENTE.forEach(campo => {
    if (!body[campo]) errores.push(`El campo '${campo}' es requerido`);
  });
  if (body.email && !/\S+@\S+\.\S+/.test(body.email)) errores.push("El campo 'email' no es válido");
  if (body.rfc && body.rfc.length < 10) errores.push("El campo 'rfc' parece incorrecto");
  if (body.telefono && typeof body.telefono !== "string") errores.push("El campo 'telefono' debe ser una cadena de texto");
  if (body.telefono && !/^\+?[0-9\s\-()]{7,15}$/.test(body.telefono)) errores.push("El campo 'telefono' no es un número válido");
  Object.keys(body).forEach(campo => {
    if (!CAMPOS_CLIENTE.includes(campo)) errores.push(`Campo no permitido: '${campo}'`);
  });

  return errores;
};
const CAMPOS_CLIENTE_UPDATE = ["razonSocial", "nombreComercial", "rfc", "email", "telefono"]
const validarClientePut = (body) => {
  const errores = [];
  if (!body || Object.keys(body).length === 0) return ["Debe enviar al menos un campo para actualizar"];

  if (body.email && !/\S+@\S+\.\S+/.test(body.email)) errores.push("El campo 'email' no es válido");
  if (body.rfc && body.rfc.length < 10) errores.push("El campo 'rfc' parece incorrecto");
  if (body.telefono && typeof body.telefono !== "string") errores.push("El campo 'telefono' debe ser una cadena de texto");
  if (body.telefono && !/^\+?[0-9\s\-()]{7,15}$/.test(body.telefono)) errores.push("El campo 'telefono' no es un número válido");

  Object.keys(body).forEach(campo => {
    if (!CAMPOS_CLIENTE_UPDATE.includes(campo)) errores.push(`Campo no permitido: '${campo}'`);
  });

  return errores;
};


export const clientesHandler = async (event) => {
	try {
		const method = event.httpMethod  || event.requestContext?.http?.method;
		const id = event.pathParameters?.id;
		const body = event.body ? JSON.parse(event.body) : null;
		console.log(method)
		switch (method) {
			case "POST":
				{
					body.id = crearID();
					const errores = validarClientePost(body);
					if (errores.length) return { statusCode: 400, body: JSON.stringify({ errores }) };

					// VERIFICACIÓN DE DUPLICADOS DE CLIENTE (RFC o Email)
					const duplicado = await checkIfRfcOrEmailExists(body.rfc, body.email);
					if (duplicado) {
						return {
							statusCode: 409, // Conflict
							body: JSON.stringify({
								error: `El cliente ya existe`,
								idExistente: duplicado.id
							})
						};
					}
					// FIN VERIFICACIÓN DUPLICADOS

					const nuevoCliente = await crearCliente(body);
					return { statusCode: 201, body: JSON.stringify(nuevoCliente) };
				}
			case "GET":
				if (id) {
					const cliente = await obtenerCliente(id);
					return cliente
						? { statusCode: 200, body: JSON.stringify(cliente) }
						: { statusCode: 404, body: "Cliente no encontrado" };
				} else {
					const clientelist= await listarClientes();
					return clientelist
					? { statusCode: 200, body: JSON.stringify(clientelist) }
					: { statusCode: 404, body: "No hay clientes" };
				}

			case "PUT":
				{
					if (!id) return { statusCode: 400, body: "ID requerido"+method };
					const errores = validarClientePut(body);
					if (errores.length) return { statusCode: 400, body: JSON.stringify({ errores }) };
					const actualizado = await actualizarCliente(id, body);
					return { statusCode: 200, body: JSON.stringify(actualizado) };
				}

			case "DELETE":
				if (!id) return { statusCode: 400, body: "ID requerido" };
				await eliminarCliente(id);
				return { statusCode: 204, body: "Cliente ejecutado >:[" };

			default:
				return { statusCode: 405, body: "Método no permitido" };
		}
	} catch (err) {
		console.error(err);
		return { statusCode: 500, body: "Error interno del servidor" };
	}
};