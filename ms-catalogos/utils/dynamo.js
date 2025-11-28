import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const db = DynamoDBDocumentClient.from(client);

// Tablas definidas por variables de entorno
const TABLE_CLIENTES = process.env.TABLE_CLIENTES || "Clientes";
const TABLE_PRODUCTOS = process.env.TABLE_PRODUCTOS || "Productos";
const TABLE_DOMICILIOS = process.env.TABLE_DOMICILIOS || "Domicilios";

// --- CLIENTES ---
export const crearCliente = async (cliente) => {
  await db.send(new PutCommand({ TableName: TABLE_CLIENTES, Item: cliente }));
  return cliente;
};
export const obtenerCliente = async (id) => {
  const { Item } = await db.send(new GetCommand({ TableName: TABLE_CLIENTES, Key: { id } }));
  return Item;
};
export const listarClientes = async () => {
  const { Items } = await db.send(new ScanCommand({ TableName: TABLE_CLIENTES }));
  return Items;
};
export const actualizarCliente = async (id, updateFields) => {
  const updateExpr = [];
  const exprAttrValues = {};
  for (const key in updateFields) {
    updateExpr.push(`${key} = :${key}`);
    exprAttrValues[`:${key}`] = updateFields[key];
  }
  const { Attributes } = await db.send(new UpdateCommand({
    TableName: TABLE_CLIENTES, Key: { id },
    UpdateExpression: `set ${updateExpr.join(', ')}`,
    ExpressionAttributeValues: exprAttrValues, ReturnValues: "ALL_NEW"
  }));
  return Attributes;
};
export const eliminarCliente = async (id) => {
  await db.send(new DeleteCommand({ TableName: TABLE_CLIENTES, Key: { id } }));
};

// --- PRODUCTOS ---
export const crearProducto = async (producto) => {
  await db.send(new PutCommand({ TableName: TABLE_PRODUCTOS, Item: producto }));
  return producto;
};
export const obtenerProducto = async (id) => {
  const { Item } = await db.send(new GetCommand({ TableName: TABLE_PRODUCTOS, Key: { id } }));
  return Item;
};
export const listarProductos = async () => {
  const { Items } = await db.send(new ScanCommand({ TableName: TABLE_PRODUCTOS }));
  return Items;
};
export const actualizarProducto = async (id, updateFields) => {
  const updateExpr = [];
  const exprAttrValues = {};
  for (const key in updateFields) {
    updateExpr.push(`${key} = :${key}`);
    exprAttrValues[`:${key}`] = updateFields[key];
  }
  const { Attributes } = await db.send(new UpdateCommand({
    TableName: TABLE_PRODUCTOS, Key: { id },
    UpdateExpression: `set ${updateExpr.join(', ')}`,
    ExpressionAttributeValues: exprAttrValues, ReturnValues: "ALL_NEW"
  }));
  return Attributes;
};
export const eliminarProducto = async (id) => {
  await db.send(new DeleteCommand({ TableName: TABLE_PRODUCTOS, Key: { id } }));
};

// --- DOMICILIOS ---
export const crearDomicilio = async (domicilio) => {
  await db.send(new PutCommand({ TableName: TABLE_DOMICILIOS, Item: domicilio }));
  return domicilio;
};
export const obtenerDomicilio = async (id) => {
  const { Item } = await db.send(new GetCommand({ TableName: TABLE_DOMICILIOS, Key: { id } }));
  return Item;
};
export const listarDomicilios = async () => {
  const { Items } = await db.send(new ScanCommand({ TableName: TABLE_DOMICILIOS }));
  return Items;
};
export const actualizarDomicilio = async (id, updateFields) => {
  const updateExpr = [];
  const exprAttrValues = {};
  for (const key in updateFields) {
    updateExpr.push(`${key} = :${key}`);
    exprAttrValues[`:${key}`] = updateFields[key];
  }
  const { Attributes } = await db.send(new UpdateCommand({
    TableName: TABLE_DOMICILIOS, Key: { id },
    UpdateExpression: `set ${updateExpr.join(', ')}`,
    ExpressionAttributeValues: exprAttrValues, ReturnValues: "ALL_NEW"
  }));
  return Attributes;
};
export const eliminarDomicilio = async (id) => {
  await db.send(new DeleteCommand({ TableName: TABLE_DOMICILIOS, Key: { id } }));
};