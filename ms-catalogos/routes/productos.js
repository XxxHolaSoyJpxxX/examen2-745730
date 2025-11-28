import {
	crearProducto,
	obtenerProducto,
	listarProductos,
	actualizarProducto,
	eliminarProducto,
	checkIfProductNameExists // <-- NUEVA IMPORTACIÓN
} from "../utils/dynamo.js";
import { generarID } from "../utils/id.js";


const CAMPOS_PRODUCTO = ["id", "nombre", "unidadMedida", "precioBase"];
const crearID = () => {
	  return 'prod-' +generarID();
};

const validarProductoPost = (body) => {
	const errores = [];
	if (!body) return ["Body no puede estar vacío"];

	["id", "nombre", "unidadMedida", "precioBase"].forEach(campo => {
		if (!body[campo]) errores.push(`El campo '${campo}' es requerido`);
	});

	if (body.precioBase && typeof body.precioBase !== "number") {
		errores.push("El campo 'precioBase' debe ser un número");
	}
	Object.keys(body).forEach(campo => {
		if (!CAMPOS_PRODUCTO.includes(campo)) errores.push(`Campo no permitido: '${campo}'`);
	});

	return errores;
};
const CAMPOS_PRODUCTO_UPDATE = ["nombre", "unidadMedida", "precioBase"];
const validarProductoPut = (body) => {
	const errores = [];
	if (!body || Object.keys(body).length === 0) return ["Debe enviar al menos un campo para actualizar"];

	if (body.precioBase && typeof body.precioBase !== "number") {
		errores.push("El campo 'precioBase' debe ser un número");
	}
	Object.keys(body).forEach(campo => {
		if (!CAMPOS_PRODUCTO_UPDATE.includes(campo)) errores.push(`Campo no permitido: '${campo}'`);
	});

	return errores;
};

export const productosHandler = async (event) => {
	try {
		const method = event.httpMethod  || event.requestContext?.http?.method;
		const id = event.pathParameters?.id;
		const body = event.body ? JSON.parse(event.body) : null;

		switch (method) {
			case "POST":
				{
					body.id = crearID();
					const errores = validarProductoPost(body);
					if (errores.length) return { statusCode: 400, body: JSON.stringify({ errores }) };
					
					// VERIFICACIÓN DE DUPLICADOS DE PRODUCTO (por nombre)
					const productoDuplicado = await checkIfProductNameExists(body.nombre);
					if (productoDuplicado) {
						return {
							statusCode: 409, // Conflict
							body: JSON.stringify({
								error: `El producto con nombre '${body.nombre}' ya existe.`,
								idExistente: productoDuplicado.id
							})
						};
					}
					// FIN VERIFICACIÓN DUPLICADOS

					const nuevoProducto = await crearProducto(body);
					return { statusCode: 201, body: "Exito:"+JSON.stringify(nuevoProducto) };
				}

			case "GET":
				if (id) {
					const producto = await obtenerProducto(id);
					return producto
						? { statusCode: 200, body: JSON.stringify(producto) }
						: { statusCode: 404, body: "Producto no encontrado" };
				} else {
					const productos = await listarProductos();
					return { statusCode: 200, body: JSON.stringify(productos) };
				}

			case "PUT":
				{
					if (!id) return { statusCode: 400, body: "ID requerido" };
					const errores = validarProductoPut(body);
					if (errores.length) return { statusCode: 400, body: JSON.stringify({ errores }) };
					const actualizado = await actualizarProducto(id, body);
					return { statusCode: 200, body: JSON.stringify(actualizado) };
				}

			case "DELETE":
				if (!id) return { statusCode: 400, body: "ID requerido" };
				await eliminarProducto(id);
				return { statusCode: 204, body: "" };

			default:
				return { statusCode: 405, body: "Método no permitido" };
		}
	} catch (err) {
		console.error(err);
		return { statusCode: 500, body: "Error interno del servidor" };
	}
};