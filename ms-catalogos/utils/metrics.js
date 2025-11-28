export const logMetric = (name, value, unit, dimensions = {}) => {
  console.log(JSON.stringify({
    "_aws": {
      "Timestamp": Date.now(),
      "CloudWatchMetrics": [{
        "Namespace": "SistemaVentas",
        "Dimensions": [["Environment", "Service", ...Object.keys(dimensions)]],
        "Metrics": [{ "Name": name, "Unit": unit }]
      }]
    },
    "Environment": process.env.ENVIRONMENT || "LOCAL",
    "Service": process.env.SERVICE_NAME || "Catalogos",
    [name]: value,
    ...dimensions
  }));
};

export const withObservability = (handler, serviceName) => async (event, context) => {
  const start = Date.now();
  let statusCode = 200;
  try {
    const result = await handler(event, context);
    statusCode = result.statusCode || 200;
    return result;
  } catch (err) {
    statusCode = 500;
    console.error("Error:", err);
    throw err;
  } finally {
    const duration = Date.now() - start;
    const statusRange = `${Math.floor(statusCode / 100)}xx`;
    logMetric("ExecutionTime", duration, "Milliseconds", { Service: serviceName });
    logMetric("RequestCount", 1, "Count", { Service: serviceName, Status: statusRange });
  }
};