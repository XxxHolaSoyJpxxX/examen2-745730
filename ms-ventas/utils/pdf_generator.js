import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

// Función auxiliar para dibujar la tabla de productos y los totales
const drawTable = (doc, data, y) => {
    doc.fontSize(10);
    let yPosition = y;
    const descriptionX = 150;
    const quantityX = 350;
    const priceX = 420;
    const totalX = 500;
    const marginX = 50;
    
    // Encabezados
    doc.text('Producto', descriptionX, yPosition)
       .text('Cant.', quantityX, yPosition)
       .text('P. Unit.', priceX, yPosition)
       .text('Subtotal', totalX, yPosition);
    yPosition += 20;
    
    // Items (Múltiples productos)
    for (const item of data.items) {
        doc.text(item.nombre, descriptionX, yPosition)
           .text(item.cantidad.toString(), quantityX, yPosition)
           .text(`${item.precioUnitario.toFixed(2)}`, priceX, yPosition)
           .text(`${item.subtotal.toFixed(2)}`, totalX, yPosition);
        yPosition += 15;
    }
    
    // Dibujar línea separadora
    doc.strokeColor("#aaaaaa")
       .lineWidth(0.5)
       .moveTo(marginX, yPosition)
       .lineTo(550, yPosition)
       .stroke();
    yPosition += 5;
    
    // Totales (SUBTOTAL, IMPORTE/IVA, TOTAL FINAL)
    
    // Subtotal (Base imponible)
    yPosition += 10;
    doc.fontSize(10)
       .text('SUBTOTAL (Sin Impuestos):', 300, yPosition, { align: 'right' })
       .text(`${data.subtotal.toFixed(2)}`, totalX, yPosition);
    
    // Importe/Impuestos (IVA)
    yPosition += 15;
    doc.text('IMPUESTOS (IVA):', 300, yPosition, { align: 'right' })
       .text(`${data.importe.toFixed(2)}`, totalX, yPosition);
    
    // Total Final
    yPosition += 20;
    doc.fontSize(12)
       .text('TOTAL FINAL:', 300, yPosition, { align: 'right' })
       .text(`${data.total.toFixed(2)}`, totalX, yPosition);
};

export const generarPDF = async (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    const chunks = [];
    doc.pipe(stream);
    
    // Cabecera
    doc.fontSize(18).text('NOTA DE VENTA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12)
       .text(`Folio: ${data.folio}`)
       .text(`Fecha: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    
    // Información del cliente
    doc.text('Cliente:');
    doc.text(`Razón Social: ${data.cliente.razonSocial || ''}`)
       .text(`RFC: ${data.cliente.rfc || ''}`)
       .text(`Correo: ${data.cliente.email || ''}`);
    doc.moveDown();
    
    // Dibujar tabla de productos
    doc.fontSize(14).text('Detalle de Productos:', 50, doc.y);
    doc.moveDown();
    drawTable(doc, data, doc.y);
    
    doc.end();
    
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
};