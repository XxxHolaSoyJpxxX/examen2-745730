import {
  crearNotaVenta,
  obtenerNotaVenta,
  crearContenidoNota,
  obtenerCliente,
  obtenerProducto,
  obtenerDomicilio,
} from "../utils/dynamo.js";
import { uploadFile, updateMetadata, getFile, getMetadata } from "../utils/s3.js"; // Se agregó getMetadata
import { publicarEvento } from "../utils/sns.js"; // Asumo que usas publicarEvento de nuestra conversación
import { generarID } from "../utils/id.js";
import { generarPDF } from "../utils/pdf_genrator.js";
// import { withObservability } from "../utils/metrics.js"; // Asumo que se envuelve en index.js

const BUCKET = "examen-2-745730"; // Usamos el nombre de bucket que proporcionaste

const CAMPOS_VENTA = [
  "cliente",
  "domicilioFacturacion",
  "domicilioEnvio",
  "items",
  "importe" 
];

// Validación de POST
const validarVentaPost = (body) => {
  const errores = [];
  if (!body) return ["Body no puede estar vacío"];

  CAMPOS_VENTA.forEach((campo) => {
    if (body[campo] === undefined) errores.push(`El campo '${campo}' es requerido`);
  });

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errores.push("El campo 'items' debe ser un array con al menos un producto.");
  } else {
    body.items.forEach((item, index) => {
      if (!item.productoId || !item.cantidad) {
        errores.push(`Item ${index}: Falta 'productoId' o 'cantidad'.`);
      }
      if (typeof item.cantidad !== "number" || item.cantidad <= 0) {
        errores.push(`Item ${index}: 'cantidad' debe ser un número positivo.`);
      }
    });
  }

  if (typeof body.importe !== "number" || body.importe < 0) {
     errores.push("El campo 'importe' (impuestos) debe ser un número mayor o igual a cero.");
  }

  return errores;
};


const coreVentasHandler = async (event) => {
    const method = event.httpMethod || event.requestContext?.http?.method;
    const notaIdParam = event.pathParameters?.id;
    const body = event.body ? JSON.parse(event.body) : null;

    switch (method) {
      case "POST":
        {
            const errores = validarVentaPost(body);
            if (errores.length) return { statusCode: 400, body: JSON.stringify({ errores }) };

            const notaId = "nv_" + generarID();
            const folio = "FOLIO-" + generarID();
            let subtotalProductos = 0; 
            const productosVendidos = [];
            const impuestos = body.importe;

            // 1. Obtener datos maestros
            const [clienteData, domicilioF, domicilioE] = await Promise.all([
                obtenerCliente(body.cliente),
                obtenerDomicilio(body.domicilioFacturacion),
                obtenerDomicilio(body.domicilioEnvio),
            ]);

            if (!clienteData || !domicilioF || !domicilioE) {
                return { statusCode: 404, body: "Cliente o Domicilio(s) no encontrados." };
            }

            // 2. Procesar cada item y calcular subtotal
            for (const item of body.items) {
                const producto = await obtenerProducto(item.productoId);
                if (!producto) {
                    return { statusCode: 404, body: `Producto con ID ${item.productoId} no encontrado.` };
                }
                
                const subtotalItem = item.cantidad * producto.precioBase;
                subtotalProductos += subtotalItem;

                productosVendidos.push({
                    ...item,
                    nombre: producto.nombre,
                    precioUnitario: producto.precioBase,
                    subtotal: subtotalItem,
                });

                // 3. Guardar Contenido de Nota
                await crearContenidoNota({
                    id: 'cn_' + generarID(),
                    notaId: notaId,
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                    precioUnitario: producto.precioBase,
                    subtotal: subtotalItem
                });
            }
            
            const totalVenta = subtotalProductos + impuestos;

            // 4. Guardar Nota principal
            const nuevaNota = {
                id: notaId,
                folio: folio,
                cliente: clienteData.id,
                domicilioFacturacion: domicilioF.id,
                domicilioEnvio: domicilioE.id,
                subtotal: subtotalProductos,
                importe: impuestos,
                total: totalVenta,
                fecha: new Date().toISOString(),
            };
            await crearNotaVenta(nuevaNota);

            // 5. Generar PDF (pasa el array de items y los totales)
            const pdfBuffer = await generarPDF({
                folio,
                cliente: clienteData,
                items: productosVendidos,
                subtotal: subtotalProductos,
                importe: impuestos,
                total: totalVenta
            });
            const key = `${clienteData.rfc}/${folio}.pdf`;
            await uploadFile(BUCKET, key, pdfBuffer);

            // 6. Notificar (SNS) - FIX AQUI
            // Obtenemos el host y puerto de la petición Express/HTTP
            const host = event.get('host') || 'localhost:3002'; // '44.222.120.51:3002'
            const rutaDescarga = `http://${host}/ventas/${notaId}`;
            
            await publicarEvento({
                tipo: "VENTA_CREADA",
                email: clienteData.email,
                folio: folio,
                ruta: rutaDescarga // URL CORREGIDA
            });

            return { statusCode: 201, body: JSON.stringify({ notaId, folio, subtotal: subtotalProductos, impuestos: impuestos, total: totalVenta, mensaje: "Nota de venta procesada." }) };
        }

      case "GET": {
        // Lógica de descarga (queda igual)
        if (!notaIdParam) return { statusCode: 400, body: "ID requerido" };

        const notaDescarga = await obtenerNotaVenta(notaIdParam);
        if (!notaDescarga) return { statusCode: 404, body: "Nota de venta no encontrada" };
        const clienteDescarga = await obtenerCliente(notaDescarga.cliente);
        if (!clienteDescarga) return { statusCode: 404, body: "Cliente de la nota no encontrado" };
        const rfcDescarga = clienteDescarga.rfc;
        if (!rfcDescarga) return { statusCode: 404, body: "RFC del cliente no encontrado" };

        const downloadKey = `${rfcDescarga}/${notaDescarga.folio}.pdf`;
        const archivo = await getFile(BUCKET, downloadKey);
        const metadataActual = archivo.Metadata || {};

        await updateMetadata(BUCKET, downloadKey, {
          ...metadataActual,
          "nota-descargada": "true"
        });

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${notaDescarga.folio}.pdf"`
          },
          body: archivo.Body.toString("base64"),
          isBase64Encoded: true
        };
      }

      default:
        return { statusCode: 405, body: "Método no permitido" };
    }
  }

export const ventasHandler = coreVentasHandler; // Asume que el wrapper de métricas está en index.js/Express