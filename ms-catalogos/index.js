import express from 'express';
import { clientesHandler } from "./routes/clientes.js";
import { domiciliosHandler } from "./routes/domicilios.js";
import { productosHandler } from "./routes/productos.js";
import { withObservability } from "./utils/metrics.js";

const app = express();
app.use(express.json());

const expressAdapter = (handler, serviceName) => async (req, res) => {
    const event = {
        httpMethod: req.method,
        path: req.path,
        pathParameters: req.params,
        body: JSON.stringify(req.body),
        rawPath: req.path
    };
    try {
        const logic = withObservability(handler, serviceName);
        const result = await logic(event);
        res.status(result.statusCode).set(result.headers || {}).send(result.body);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno");
    }
};

app.all('/clientes*', expressAdapter(clientesHandler, "CatalogosService"));
app.all('/clientes/:id', expressAdapter(clientesHandler, "CatalogosService"));
app.all('/domicilios*', expressAdapter(domiciliosHandler, "CatalogosService"));
app.all('/domicilios/:id', expressAdapter(domiciliosHandler, "CatalogosService"));
app.all('/productos*', expressAdapter(productosHandler, "CatalogosService"));
app.all('/productos/:id', expressAdapter(productosHandler, "CatalogosService"));

// IMPORTANTE: Docker usará el puerto 8080 internamente
const PORT = 8080;
app.listen(PORT, () => console.log(`Catalogos corriendo en puerto ${PORT}`));