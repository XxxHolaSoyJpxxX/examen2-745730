import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: "us-east-1" });
// Usamos el ARN de tu tema Estándar (corregido en la conversación)
const TOPIC_ARN = "arn:aws:sns:us-east-1:187758670772:NotificacionesVentas"; 


export const enviarNotificacion = async (email, folio, ruta) => {
  try {
    // El mensaje ahora debe ser el objeto que el MS-Notificaciones espera (JSON)
    const mensaje = {
        tipo: "VENTA_CREADA",
        email: email,
        folio: folio,
        ruta: ruta 
    };
    
    const command = new PublishCommand({
      TopicArn: TOPIC_ARN,
      Message: JSON.stringify(mensaje), // Enviamos el JSON
      MessageAttributes: {
         "tipo": { DataType: "String", StringValue: "VENTA_CREADA" }
      }
    });
    
    const response = await snsClient.send(command);
    console.log("Notificación enviada a SNS. MessageId:", response.MessageId);
    return response;
  } catch (error) {
    console.error("Error al enviar notificación:", error);
  }
};