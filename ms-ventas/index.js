import express from 'express';
import { ventasHandler } from "./routes/ventas.js";
import { withObservability } from "./utils/metrics.js";

const app = express();
app.use(express.json());

const expressAdapter = (handler, serviceName) => async (req, res) => {
    const event = {
        httpMethod: req.method,
        path: req.path,
        pathParameters: req.params,
        body: JSON.stringify(req.body),
        requestContext: { 
            http: { method: req.method },
            domainName: req.get('host') 
        }
    };
    try {
        const logic = withObservability(handler, serviceName);
        const result = await logic(event);
        if (result.isBase64Encoded) {
             const buffer = Buffer.from(result.body, 'base64');
             res.status(result.statusCode).set(result.headers).send(buffer);
        } else {
             res.status(result.statusCode).set(result.headers || {}).send(result.body);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno");
    }
};

app.post('/ventas', expressAdapter(ventasHandler, "VentasService"));
app.get('/ventas/:id', expressAdapter(ventasHandler, "VentasService"));

const PORT = 8080;
app.listen(PORT, () => console.log(`Ventas corriendo en puerto ${PORT}`));