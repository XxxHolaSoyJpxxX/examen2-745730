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
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const stream = new PassThrough();
    const chunks = [];
    doc.pipe(stream);
    
    // Cabecera con fondo
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('NOTA DE VENTA', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Línea decorativa
    doc.strokeColor("#000000")
       .lineWidth(2)
       .moveTo(200, doc.y)
       .lineTo(400, doc.y)
       .stroke();
    
    doc.moveDown(1.5);
    
    // Información de la nota
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text(`Folio: `, 50, doc.y, { continued: true })
       .font('Helvetica')
       .text(data.folio);
    
    doc.font('Helvetica-Bold')
       .text(`Fecha: `, 50, doc.y, { continued: true })
       .font('Helvetica')
       .text(new Date().toLocaleDateString('es-MX', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
       }));
    
    doc.moveDown(1.5);
    
    // Información del cliente en un recuadro
    const clienteY = doc.y;
    doc.rect(50, clienteY, 500, 80)
       .stroke();
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('INFORMACIÓN DEL CLIENTE', 60, clienteY + 10);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Razón Social: ${data.cliente.razonSocial || 'N/A'}`, 60, clienteY + 30)
       .text(`RFC: ${data.cliente.rfc || 'N/A'}`, 60, clienteY + 45)
       .text(`Correo: ${data.cliente.email || 'N/A'}`, 60, clienteY + 60);
    
    doc.y = clienteY + 90;
    doc.moveDown(1);
    
    // Título de productos
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('DETALLE DE PRODUCTOS', 50, doc.y);
    
    doc.moveDown(0.8);
    
    // Dibujar tabla de productos
    drawTable(doc, data, doc.y);
    
    // Footer
    doc.fontSize(8)
       .font('Helvetica')
       .text('Gracias por su preferencia', { align: 'center' });
    
    doc.end();
    
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
};