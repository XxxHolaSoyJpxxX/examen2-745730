import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export const generarPDF = async (venta) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    const chunks = [];
    doc.pipe(stream);

    doc.fontSize(18).text('NOTA DE VENTA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Folio: ${venta.folio}`);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    
    doc.text(`Cliente: ${venta.nombre || ''} - RFC: ${venta.rfc || ''}`);
    doc.moveDown();
    
    const total = (venta.cantidad * venta.precioUnitario + venta.importe).toFixed(2);
    doc.text(`1. ${venta.producto} - Cantidad: ${venta.cantidad} - Precio: $${venta.precioUnitario}`);
    doc.moveDown();
    doc.text(`TOTAL: $${total}`, { align: 'right' });
    doc.end();

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
};