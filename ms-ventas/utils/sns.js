import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
const snsClient = new SNSClient({ region: process.env.AWS_REGION || "us-east-1" });

export const publicarEvento = async (mensaje) => {
  const command = new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_NOTIFICACIONES,
    Message: JSON.stringify(mensaje),
    MessageAttributes: {
      "tipo": { DataType: "String", StringValue: "VENTA_CREADA" }
    }
  });
  await snsClient.send(command);
};