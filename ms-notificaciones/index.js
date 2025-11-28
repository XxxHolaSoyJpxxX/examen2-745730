import express from 'express';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { withObservability } from "./utils/metrics.js";

const app = express();
app.use(express.json());
app.use(express.text());

const ses = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });
const EMAIL_REMITENTE = process.env.EMAIL_REMITENTE;
const SIMULATE_EMAIL = process.env.SIMULATE_EMAIL === "true";

const processNotification = async (body) => {
    const mensaje = body.Message ? JSON.parse(body.Message) : body;
    if (mensaje.tipo === "VENTA_CREADA") {
        if (SIMULATE_EMAIL) {
            console.log(`[SIMULACION] Email a: ${mensaje.email} | Link: ${mensaje.ruta}`);
            return;
        }
        try {
            await ses.send(new SendEmailCommand({
                Source: EMAIL_REMITENTE,
                Destination: { ToAddresses: [mensaje.email] },
                Message: {
                    Subject: { Data: `Nota: ${mensaje.folio}` },
                    Body: { Text: { Data: `Descarga: ${mensaje.ruta}` } }
                }
            }));
            console.log("Correo enviado SES");
        } catch (err) {
            console.error("Error SES:", err.message);
        }
    }
};

app.post('/notifications', async (req, res) => {
    try {
        if (req.header('x-amz-sns-message-type') === 'SubscriptionConfirmation') {
            const fetch = (await import('node-fetch')).default;
            await fetch(req.body.SubscribeURL);
            return res.send("Confirmado");
        }
        await withObservability(() => processNotification(req.body), "NotificacionesService")({}, {});
        res.status(200).send("OK");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error");
    }
});

const PORT = 8080;
app.listen(PORT, () => console.log(`Notificaciones corriendo en puerto ${PORT}`));