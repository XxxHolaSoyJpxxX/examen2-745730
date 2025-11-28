import {
	crearDomicilio,
	obtenerDomicilio, listarDomicilios,
	actualizarDomicilio,
	eliminarDomicilio,
	checkIfDomicilioExists // <-- NUEVA IMPORTACIÓN
} from "../utils/dynamo.js";
import { generarID } from "../utils/id.js";

const CAMPOS_DOMICILIO = ["id", "clienteId", "domicilio", "colonia", "municipio", "estado", "tipoDireccion"];

const crearID = () => {
	  return 'dom-' + generarID();
}

const validarDomicilioPost = (body) => {
	const errores = [];
	if (!body) return ["Body no puede estar vacío"];
	CAMPOS_DOMICILIO.forEach(campo => {
		if (!body[campo]) errores.push(`El campo '${campo}' es requerido`);
	});
	if (body.tipoDireccion && !["FACTURACIÓN", "ENVÍO"].includes(body.tipoDireccion)) {
		errores.push("El campo 'tipoDireccion' debe ser FACTURACIÓN o ENVÍO");
	}
	Object.keys(body).forEach(campo => {
		if (!CAMPOS_DOMICILIO.includes(campo)) errores.push(`Campo no permitido: '${campo}'`);
	});

	return errores;
};
const CAMPOS_DOMICILIO_UPDATE = ["domicilio", "colonia", "municipio", "estado", "tipoDireccion"];

const validarDomicilioPut = (body) => {
	const errores = [];
	if (!body || Object.keys(body).length === 0) return ["Debe enviar al menos un campo para actualizar"];
	if (body.tipoDireccion && !["FACTURACIÓN", "ENVÍO"].includes(body.tipoDireccion)) {
		errores.push("El campo 'tipoDireccion' debe ser FACTURACIÓN o ENVÍO");
	}
	Object.keys(body).forEach(campo => {
		if (!CAMPOS_DOMICILIO_UPDATE.includes(campo)) errores.push(`Campo no permitido: '${campo}'`);
	});

	return errores;
};

export const domiciliosHandler = async (event) => {
	try {
		const method = event.httpMethod || event.requestContext?.http?.method;
		const id = event.pathParameters?.id;
		const body = event.body ? JSON.parse(event.body) : null;

		switch (method) {
			case "POST":
				{
					body.id = crearID();
					const errores = validarDomicilioPost(body);
					if (errores.length) return { statusCode: 400, body: JSON.stringify({ errores }) };
					
					// VERIFICACIÓN DE DUPLICADOS DE DOMICILIO
					if (body.tipoDireccion === "FACTURACIÓN" || body.tipoDireccion === "ENVÍO") {
						const domicilioDuplicado = await checkIfDomicilioExists(body.clienteId, body.tipoDireccion);
						if (domicilioDuplicado) {
							return {
								statusCode: 409, // Conflict
								body: JSON.stringify({
									error: `El cliente ya tiene un domicilio registrado con el tipo '${body.tipoDireccion}'. Solo se permite uno por tipo.`,
									idExistente: domicilioDuplicado.id
								})
							};
						}
					}
					// FIN VERIFICACIÓN DUPLICADOS

					const nuevoDomicilio = await crearDomicilio(body);
					return { statusCode: 201, body: JSON.stringify(nuevoDomicilio) };
				}

			case "GET":
				if (id) {
					const domicilio = await obtenerDomicilio(id);
					return domicilio
						? { statusCode: 200, body: JSON.stringify(domicilio) }
						: { statusCode: 404, body: "Domicilio no encontrado" };
				} else {
					const domicilios = await listarDomicilios();
					return { statusCode: 200, body: "Domicilios"+JSON.stringify(domicilios) };
				}

			case "PUT":
				{
					if (!id) return { statusCode: 400, body: "ID requerido" };
					const errores = validarDomicilioPut(body);
					if (errores.length) return { statusCode: 400, body: JSON.stringify({ errores }) };
					const actualizado = await actualizarDomicilio(id, body);
					return { statusCode: 200, body: JSON.stringify(actualizado) };
				}

			case "DELETE":
				if (!id) return { statusCode: 400, body: "ID requerido" };
				await eliminarDomicilio(id);
				return { statusCode: 204, body: "" };

			default:
				return { statusCode: 405, body: "Método no permitido" };
		}
	} catch (err) {
		console.error(err);
		return { statusCode: 500, body: "Error interno del servidor" };
	}
};