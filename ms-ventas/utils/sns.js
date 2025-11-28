import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: "us-east-1" });
// Usamos el ARN de tu tema Estándar (corregido en la conversación)
const TOPIC_ARN = "arn:aws:sns:us-east-1:187758670772:NotificacionesVentas";


export const publicarEvento = async (mensaje) => {
  try {
    // SNS usa JSON para enviar datos estructurados. El mensaje ya es un objeto JSON
    const command = new PublishCommand({
      TopicArn: TOPIC_ARN,
      Message: JSON.stringify(mensaje),
      MessageAttributes: {
         "tipo": { DataType: "String", StringValue: "VENTA_CREADA" }
      }
    });
    const response = await snsClient.send(command);
    console.log("Evento publicado en SNS. MessageId:", response.MessageId);
    return response;
  } catch (error) {
    console.error("Error al publicar evento en SNS:", error);
  }
};