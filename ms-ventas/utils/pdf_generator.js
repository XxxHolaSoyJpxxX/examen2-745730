import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

// Función auxiliar para dibujar la tabla de productos y los totales
const drawTable = (doc, data, y) => {
    let yPosition = y;
    const marginX = 50;
    const productX = 50;
    const quantityX = 320;
    const priceX = 380;
    const subtotalX = 480;
    const pageWidth = 550;
    
    // Encabezados de la tabla
    doc.fontSize(10);
    doc.font('Helvetica-Bold');
    doc.text('Producto', productX, yPosition);
    doc.text('Cant.', quantityX, yPosition);
    doc.text('P. Unit.', priceX, yPosition);
    doc.text('Subtotal', subtotalX, yPosition);
    
    yPosition += 15;
    
    // Línea debajo de encabezados
    doc.strokeColor("#000000");
    doc.lineWidth(1);
    doc.moveTo(marginX, yPosition);
    doc.lineTo(pageWidth, yPosition);
    doc.stroke();
    
    yPosition += 10;
    
    // Items (Múltiples productos)
    doc.font('Helvetica');
    for (const item of data.items) {
        // Verificar si necesitamos nueva página
        if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
        }
        
        doc.fontSize(9);
        doc.text(item.nombre, productX, yPosition, { width: 260 });
        doc.text(item.cantidad.toString(), quantityX, yPosition, { width: 50, align: 'center' });
        doc.text(`$${item.precioUnitario.toFixed(2)}`, priceX, yPosition, { width: 90, align: 'right' });
        doc.text(`$${item.subtotal.toFixed(2)}`, subtotalX, yPosition, { width: 70, align: 'right' });
        
        yPosition += 20;
    }
    
    yPosition += 5;
    
    // Línea separadora antes de totales
    doc.strokeColor("#aaaaaa");
    doc.lineWidth(0.5);
    doc.moveTo(marginX, yPosition);
    doc.lineTo(pageWidth, yPosition);
    doc.stroke();
    
    yPosition += 15;
    
    // Totales alineados a la derecha
    const labelX = 320;
    const valueX = 450;
    const valueWidth = 100;
    
    // Subtotal (Base imponible)
    doc.fontSize(10);
    doc.font('Helvetica');
    doc.text('SUBTOTAL (Sin Impuestos):', labelX, yPosition, { width: 120, align: 'left' });
    doc.text(`$${data.subtotal.toFixed(2)}`, valueX, yPosition, { width: valueWidth, align: 'right' });
    
    // Importe/Impuestos (IVA)
    yPosition += 20;
    doc.text('IMPUESTOS (IVA):', labelX, yPosition, { width: 120, align: 'left' });
    doc.text(`$${data.importe.toFixed(2)}`, valueX, yPosition, { width: valueWidth, align: 'right' });
    
    // Línea antes del total
    yPosition += 18;
    doc.strokeColor("#000000");
    doc.lineWidth(1);
    doc.moveTo(labelX, yPosition);
    doc.lineTo(pageWidth, yPosition);
    doc.stroke();
    
    // Total Final
    yPosition += 12;
    doc.fontSize(12);
    doc.font('Helvetica-Bold');
    doc.text('TOTAL FINAL:', labelX, yPosition, { width: 120, align: 'left' });
    doc.text(`$${data.total.toFixed(2)}`, valueX, yPosition, { width: valueWidth, align: 'right' });
};

export const generarPDF = async (data) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const stream = new PassThrough();
    const chunks = [];
    doc.pipe(stream);
    
    // Cabecera con fondo
    doc.fontSize(20);
    doc.font('Helvetica-Bold');
    doc.text('NOTA DE VENTA', { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Línea decorativa
    doc.strokeColor("#000000");
    doc.lineWidth(2);
    doc.moveTo(200, doc.y);
    doc.lineTo(400, doc.y);
    doc.stroke();
    
    doc.moveDown(1.5);
    
    // Información de la nota
    doc.fontSize(11);
    doc.font('Helvetica-Bold');
    doc.text(`Folio: `, 50, doc.y, { continued: true });
    doc.font('Helvetica');
    doc.text(data.folio);
    
    doc.font('Helvetica-Bold');
    doc.text(`Fecha: `, 50, doc.y, { continued: true });
    doc.font('Helvetica');
    doc.text(new Date().toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }));
    
    doc.moveDown(1.5);
    
    // Información del cliente en un recuadro
    const clienteY = doc.y;
    doc.rect(50, clienteY, 500, 80);
    doc.stroke();
    
    doc.fontSize(12);
    doc.font('Helvetica-Bold');
    doc.text('INFORMACIÓN DEL CLIENTE', 60, clienteY + 10);
    
    doc.fontSize(10);
    doc.font('Helvetica');
    doc.text(`Razón Social: ${data.cliente.razonSocial || 'N/A'}`, 60, clienteY + 30);
    doc.text(`RFC: ${data.cliente.rfc || 'N/A'}`, 60, clienteY + 45);
    doc.text(`Correo: ${data.cliente.email || 'N/A'}`, 60, clienteY + 60);
    
    doc.y = clienteY + 90;
    doc.moveDown(1);
    
    // Título de productos
    doc.fontSize(12);
    doc.font('Helvetica-Bold');
    doc.text('DETALLE DE PRODUCTOS', 50, doc.y);
    
    doc.moveDown(0.8);
    
    // Dibujar tabla de productos
    drawTable(doc, data, doc.y);
    
    // Footer
    doc.fontSize(8);
    doc.font('Helvetica');
    doc.text('Gracias por su preferencia', { align: 'center' });
    
    doc.end();
    
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
};