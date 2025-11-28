import { crearNotaVenta, crearContenidoNota, obtenerCliente, obtenerProducto, obtenerDomicilio, obtenerNotaVenta, obtenerContenidosNota } from "../utils/dynamo.js";
import { uploadFile, getFile, updateMetadata } from "../utils/s3.js";
import { publicarEvento } from "../utils/sns.js";
import { generarID } from "../utils/id.js";
import { generarPDF } from "../utils/pdf_generator.js";

const BUCKET = process.env.BUCKET_NAME;

export const ventasHandler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const notaIdParam = event.pathParameters?.id;
  
  if (method === "POST") {
      const body = JSON.parse(event.body);
      const notaId = 'nv_' + generarID();
      const folio = 'FOLIO-' + generarID();

      // 1. Validar y obtener datos
      const clienteData = await obtenerCliente(body.cliente);
      const domicilioF = await obtenerDomicilio(body.domicilioFacturacion);
      const domicilioE = await obtenerDomicilio(body.domicilioEnvio);

      if (!clienteData || !domicilioF || !domicilioE) {
          return { statusCode: 400, body: "Datos inválidos (cliente o domicilios no existen)" };
      }

      // Validar que items sea un array
      if (!Array.isArray(body.items) || body.items.length === 0) {
          return { statusCode: 400, body: "Debe incluir al menos un producto en el array 'items'" };
      }

      // Validar que importe esté presente
      if (typeof body.importe !== 'number' || body.importe < 0) {
          return { statusCode: 400, body: "El campo 'importe' debe ser un número válido" };
      }

      // 2. Validar y procesar productos
      const productosData = [];
      let subtotalSinImpuestos = 0;

      for (const item of body.items) {
          if (!item.productoId || !item.cantidad || item.cantidad <= 0) {
              return { statusCode: 400, body: "Cada item debe tener 'productoId' y 'cantidad' válida" };
          }

          const producto = await obtenerProducto(item.productoId);
          if (!producto) {
              return { statusCode: 400, body: `Producto ${item.productoId} no existe` };
          }

          const subtotal = item.cantidad * producto.precioBase;
          subtotalSinImpuestos += subtotal;

          productosData.push({
              id: producto.id,
              nombre: producto.nombre,
              precioUnitario: producto.precioBase,
              cantidad: item.cantidad,
              subtotal
          });
      }

      // Usar el importe enviado en el request
      const importe = body.importe;
      const total = subtotalSinImpuestos + importe;

      // 3. Guardar Nota
      const nuevaNota = { 
          id: notaId, 
          folio, 
          cliente: clienteData.id, 
          domicilioFacturacion: domicilioF.domicilio,
          domicilioEnvio: domicilioE.domicilio,
          subtotal: subtotalSinImpuestos,
          importe: importe,
          total: total
      };
      await crearNotaVenta(nuevaNota);

      // 4. Guardar contenidos de la nota (uno por producto)
      for (const prod of productosData) {
          await crearContenidoNota({ 
              id: 'cn_' + generarID(), 
              notaId, 
              producto: prod.id, 
              cantidad: prod.cantidad 
          });
      }

      // 5. Generar PDF y subir
      const pdfBuffer = await generarPDF({
          folio, 
          cliente: {
              razonSocial: clienteData.razonSocial, 
              rfc: clienteData.rfc, 
              nombre: clienteData.nombre,
              email: clienteData.email
          },
          items: productosData,
          subtotal: subtotalSinImpuestos,
          importe: importe,
          total: total
      });
      const key = `${clienteData.rfc}/${folio}.pdf`;
      await uploadFile(BUCKET, key, pdfBuffer);

      // 6. NOTIFICAR (Desacoplamiento)
      const rutaDescarga = `https://${event.requestContext.domainName}/ventas/${notaId}`;
      await publicarEvento({ tipo: "VENTA_CREADA", email: clienteData.email, folio, ruta: rutaDescarga });

      return { statusCode: 201, body: JSON.stringify({ 
          notaId, 
          folio, 
          subtotal: subtotalSinImpuestos,
          importe: importe,
          total: total, 
          mensaje: "Nota creada" 
      }) };
  }

  if (method === "GET" && notaIdParam) {
      const nota = await obtenerNotaVenta(notaIdParam);
      if(!nota) return { statusCode: 404, body: "Nota no encontrada" };
      
      const cliente = await obtenerCliente(nota.cliente);
      
      const key = `${cliente.rfc}/${nota.folio}.pdf`;
      const archivo = await getFile(BUCKET, key);
      
      // Marcar como descargada
      await updateMetadata(BUCKET, key, { ...archivo.Metadata, "nota-descargada": "true" });

      return {
          statusCode: 200,
          headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${nota.folio}.pdf"` },
          body: archivo.Body.toString("base64"),
          isBase64Encoded: true
      };
  }

  return { statusCode: 405, body: "Método no permitido" };
};