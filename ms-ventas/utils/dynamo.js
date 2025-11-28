import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const db = DynamoDBDocumentClient.from(client);

const TABLE_NOTAS_VENTA = process.env.TABLE_NOTAS_VENTA || "NotasVenta";
const TABLE_CLIENTES = process.env.TABLE_CLIENTES || "Clientes";
const TABLE_PRODUCTOS = process.env.TABLE_PRODUCTOS || "Productos";
const TABLE_DOMICILIOS = process.env.TABLE_DOMICILIOS || "Domicilios";
const TABLE_NOTA_CONTENIDO = process.env.TABLE_NOTA_CONTENIDO || "NotaContenido";

export const crearNotaVenta = async (nota) => {
  await db.send(new PutCommand({ TableName: TABLE_NOTAS_VENTA, Item: nota }));
};

export const obtenerNotaVenta = async (id) => {
  const { Item } = await db.send(new GetCommand({ TableName: TABLE_NOTAS_VENTA, Key: { id } }));
  return Item;
};

export const crearContenidoNota = async (contenido) => {
  await db.send(new PutCommand({ TableName: TABLE_NOTA_CONTENIDO, Item: contenido }));
};

// Nueva función para obtener todos los contenidos de una nota
export const obtenerContenidosNota = async (notaId) => {
  // Asume que la tabla tiene un GSI con notaId como partition key
  const { Items } = await db.send(new QueryCommand({
    TableName: TABLE_NOTA_CONTENIDO,
    IndexName: "notaId-index", // Ajusta según tu GSI
    KeyConditionExpression: "notaId = :notaId",
    ExpressionAttributeValues: {
      ":notaId": notaId
    }
  }));
  return Items || [];
};

// Catálogos
export const obtenerCliente = async (id) => {
  const { Item } = await db.send(new GetCommand({ TableName: TABLE_CLIENTES, Key: { id } }));
  return Item;
};

export const obtenerProducto = async (id) => {
  const { Item } = await db.send(new GetCommand({ TableName: TABLE_PRODUCTOS, Key: { id } }));
  return Item;
};

export const obtenerDomicilio = async (id) => {
  const { Item } = await db.send(new GetCommand({ TableName: TABLE_DOMICILIOS, Key: { id } }));
  return Item;
};