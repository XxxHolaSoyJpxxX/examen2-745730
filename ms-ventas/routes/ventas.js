import { crearNotaVenta, crearContenidoNota, obtenerCliente, obtenerProducto, obtenerDomicilio, obtenerNotaVenta } from "../utils/dynamo.js";
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
      const producto = await obtenerProducto(body.producto);
      const domicilioF = await obtenerDomicilio(body.domicilioFacturacion);
      const domicilioE = await obtenerDomicilio(body.domicilioEnvio);

      if (!clienteData || !producto || !domicilioF || !domicilioE) {
          return { statusCode: 400, body: "Datos inválidos (cliente, prod o domicilios no existen)" };
      }

      // 2. Guardar Nota
      const total = body.cantidad * producto.precioBase;
      const nuevaNota = { id: notaId, folio, cliente: clienteData.id, domicilioFacturacion: domicilioF.domicilio, total };
      await crearNotaVenta(nuevaNota);
      await crearContenidoNota({ id: 'cn_'+generarID(), notaId, producto: producto.id, cantidad: body.cantidad });

      // 3. Generar PDF y subir
      const pdfBuffer = await generarPDF({
          folio, razonSocial: clienteData.razonSocial, rfc: clienteData.rfc, nombre: clienteData.nombre,
          cantidad: body.cantidad, producto: producto.nombre, precioUnitario: producto.precioBase, importe: 0
      });
      const key = `${clienteData.rfc}/${folio}.pdf`;
      await uploadFile(BUCKET, key, pdfBuffer);

      // 4. NOTIFICAR (Desacoplamiento)
      const rutaDescarga = `https://${event.requestContext.domainName}/ventas/${notaId}`;
      await publicarEvento({ tipo: "VENTA_CREADA", email: clienteData.email, folio, ruta: rutaDescarga });

      return { statusCode: 201, body: JSON.stringify({ notaId, mensaje: "Nota creada" }) };
  }

  if (method === "GET" && notaIdParam) {
      const nota = await obtenerNotaVenta(notaIdParam);
      if(!nota) return { statusCode: 404 };
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
};