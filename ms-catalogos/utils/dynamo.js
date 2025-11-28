import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";

// Cliente DynamoDB. Usa process.env para la región.
const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const db = DynamoDBDocumentClient.from(client);

// Tablas: Leemos de las variables de entorno (Factor 12)
const TABLE_CLIENTES = process.env.TABLE_CLIENTES || "Clientes";
const TABLE_PRODUCTOS = process.env.TABLE_PRODUCTOS || "Productos";
const TABLE_DOMICILIOS = process.env.TABLE_DOMICILIOS || "Domicilios";
const TABLE_NOTAS_VENTA = process.env.TABLE_NOTAS_VENTA || "NotasVenta";
const TABLE_NOTA_CONTENIDO = process.env.TABLE_NOTA_CONTENIDO || "NotaContenido";


// =======================================================
// NUEVAS FUNCIONES DE VERIFICACIÓN DE DUPLICADOS
// NOTA: Usamos Scan, se recomienda usar GSI en producción para estas búsquedas.
// =======================================================

const lookupByAttribute = async (tableName, attributeName, attributeValue) => {
  const { Items } = await db.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: "#attr = :val",
    ExpressionAttributeNames: {
      "#attr": attributeName
    },
    ExpressionAttributeValues: {
      ":val": attributeValue
    },
    Limit: 1
  }));
  return Items[0];
};

export const checkIfRfcOrEmailExists = async (rfc, email) => {
  const { Items } = await db.send(new ScanCommand({
    TableName: TABLE_CLIENTES
  }));
  const existingItems = Items?.filter(item => item.rfc === rfc || item.email === email);
  return existingItems;
};

export const checkIfProductNameExists = async (nombre) => {
  return await lookupByAttribute(TABLE_PRODUCTOS, 'nombre', nombre);
};

export const checkIfDomicilioExists = async (clienteId, tipoDireccion) => {
  // Obtener TODOS los domicilios y filtrar en memoria
  const { Items } = await db.send(new ScanCommand({
    TableName: TABLE_DOMICILIOS
  }));
  
  // Filtrar manualmente en JavaScript
  const domicilioExistente = Items?.find(item => 
    item.clienteId === clienteId && item.tipoDireccion === tipoDireccion
  );
  
  return domicilioExistente;
};

// =======================================================
// FUNCIONES CRUD EXISTENTES (Base de los archivos subidos)
// =======================================================

//////////////////////
// Clientes
//////////////////////
export const crearCliente = async (cliente) => {
  await db.send(new PutCommand({ TableName: TABLE_CLIENTES, Item: cliente }));
  return cliente;
};

export const obtenerCliente = async (id) => {
  const { Item } = await db.send(new GetCommand({
    TableName: TABLE_CLIENTES,
    Key: { id }
  }));
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
    TableName: TABLE_CLIENTES,
    Key: { id },
    UpdateExpression: `set ${updateExpr.join(', ')}`,
    ExpressionAttributeValues: exprAttrValues,
    ReturnValues: "ALL_NEW"
  }));
  return Attributes;
};

export const eliminarCliente = async (id) => {
  await db.send(new DeleteCommand({ TableName: TABLE_CLIENTES, Key: { id } }));
};

//////////////////////
// Productos
//////////////////////
export const crearProducto = async (producto) => {
  await db.send(new PutCommand({ TableName: TABLE_PRODUCTOS, Item: producto }));
  return producto;
};

export const obtenerProducto = async (id) => {
  const { Item } = await db.send(new GetCommand({
    TableName: TABLE_PRODUCTOS,
    Key: { id }
  }));
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
    TableName: TABLE_PRODUCTOS,
    Key: { id },
    UpdateExpression: `set ${updateExpr.join(', ')}`,
    ExpressionAttributeValues: exprAttrValues,
    ReturnValues: "ALL_NEW"
  }));
  return Attributes;
};

export const eliminarProducto = async (id) => {
  await db.send(new DeleteCommand({ TableName: TABLE_PRODUCTOS, Key: { id } }));
};

//////////////////////
// Domicilios
//////////////////////
export const crearDomicilio = async (domicilio) => {
  await db.send(new PutCommand({ TableName: TABLE_DOMICILIOS, Item: domicilio }));
  return domicilio;
};

export const obtenerDomicilio = async (id) => {
  const { Item } = await db.send(new GetCommand({
    TableName: TABLE_DOMICILIOS,
    Key: { id }
  }));
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
    TableName: TABLE_DOMICILIOS,
    Key: { id },
    UpdateExpression: `set ${updateExpr.join(', ')}`,
    ExpressionAttributeValues: exprAttrValues,
    ReturnValues: "ALL_NEW"
  }));
  return Attributes;
};

export const eliminarDomicilio = async (id) => {
  await db.send(new DeleteCommand({ TableName: TABLE_DOMICILIOS, Key: { id } }));
};

//////////////////////
// Notas de venta
//////////////////////
export const crearNotaVenta = async (nota) => {
  await db.send(new PutCommand({ TableName: TABLE_NOTAS_VENTA, Item: nota }));
  return nota;
};

export const obtenerNotaVenta = async (id) => {
  const { Item } = await db.send(new GetCommand({
    TableName: TABLE_NOTAS_VENTA,
    Key: { id }
  }));
  return Item;
};

export const listarNotasVenta = async () => {
  const { Items } = await db.send(new ScanCommand({ TableName: TABLE_NOTAS_VENTA }));
  return Items;
};

//////////////////////
// Contenido de nota
//////////////////////
export const crearContenidoNota = async (contenido) => {
  await db.send(new PutCommand({ TableName: TABLE_NOTA_CONTENIDO, Item: contenido }));
  return contenido;
};

export const obtenerContenidoNota = async (id) => {
  const { Item } = await db.send(new GetCommand({
    TableName: TABLE_NOTA_CONTENIDO,
    Key: { id }
  }));
  return Item;
};

export const listarContenidoNota = async () => {
  const { Items } = await db.send(new ScanCommand({ TableName: TABLE_NOTA_CONTENIDO }));
  return Items;
};