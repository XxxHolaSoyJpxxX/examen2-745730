# 🧪 Pruebas de Integración --- Sistema de Ventas Distribuido

## 🔧 Configuración Global (Postman)

**Header recomendado:**

    Content-Type: application/json

------------------------------------------------------------------------

## 1️⃣ Crear Cliente (Catálogos)

**Título:** Registrar un nuevo cliente en la BD\
**Método:** `POST`\
**URL:** `http://3.239.55.131:3001/clientes`

**Body (JSON):**

``` json
{
  "razonSocial": "Empresa de Prueba SA de CV",
  "nombreComercial": "Mi Empresa",
  "rfc": "XAXX010101000",
  "email": "juanpablo.conquistador@gmail.com",
  "telefono": "5512345678"
}
```

**Expected Result:** - `201 Created` - JSON con un campo `"id"` (ej:
`cli-a1b2c3...`)

> 📝 **NOTA:** Copia este ID.

------------------------------------------------------------------------

## 2️⃣ Crear Producto (Catálogos)

**Título:** Registrar un producto para vender\
**Método:** `POST`\
**URL:** `http://3.239.55.131:3001/productos`

**Body (JSON):**

``` json
{
  "nombre": "Monitor 4K Ultra",
  "unidadMedida": "Pieza",
  "precioBase": 5000
}
```

**Expected Result:** - `201 Created` - JSON con un campo `"id"` (ej:
`prod-x9y8z7...`)

> 📝 **NOTA:** Copia este ID.

------------------------------------------------------------------------

## 3️⃣ Crear Domicilio de Facturación (Catálogos)

**Título:** Asignar dirección al cliente\
**Método:** `POST`\
**URL:** `http://3.239.55.131:3001/domicilios`

**Body (JSON):**\
*(Sustituye `"PEGA_AQUI_ID_CLIENTE"` con el ID obtenido en el paso 1)*

``` json
{
  "clienteId": "PEGA_AQUI_ID_CLIENTE",
  "domicilio": "Calle Falsa 123",
  "colonia": "Centro",
  "municipio": "Guadalajara",
  "estado": "Jalisco",
  "tipoDireccion": "FACTURACIÓN"
}
```

**Expected Result:** - `201 Created` - JSON con un campo `"id"`

> 📝 **NOTA:** Guarda este ID como **ID_DOMICILIO_FACTURACION**.

------------------------------------------------------------------------

## 4️⃣ Crear Domicilio de Envío (Catálogos)

**Título:** Asignar dirección de envío\
**Método:** `POST`\
**URL:** `http://3.239.55.131:3001/domicilios`

**Body (JSON):**\
*(Sustituye `"PEGA_AQUI_ID_CLIENTE"` con el ID obtenido en el paso 1)*

``` json
{
  "clienteId": "PEGA_AQUI_ID_CLIENTE",
  "domicilio": "Av Siempre Viva 742",
  "colonia": "Norte",
  "municipio": "Zapopan",
  "estado": "Jalisco",
  "tipoDireccion": "ENVÍO"
}
```

**Expected Result:** - `201 Created` - JSON con un campo `"id"`

> 📝 **NOTA:** Guarda este ID como **ID_DOMICILIO_ENVIO**.

------------------------------------------------------------------------

## 5️⃣ Generar Venta (Ventas)

**Título:** Procesar venta, generar PDF y notificar\
**Método:** `POST`\
**URL:** `http://3.239.55.131:3002/ventas`

**Body (JSON):**\
*(Aquí juntas todos los IDs que anotaste)*

``` json
{
  "cliente": "PEGA_AQUI_ID_CLIENTE",
  "domicilioFacturacion": "PEGA_AQUI_ID_DOMICILIO_FACTURACION",
  "domicilioEnvio": "PEGA_AQUI_ID_DOMICILIO_ENVIO",
  "producto": "PEGA_AQUI_ID_PRODUCTO",
  "cantidad": 2,
  "importe": 0
}
```

**Expected Result:**

``` json
{
  "notaId": "nv_.....",
  "mensaje": "Nota creada"
}
```

> 📝 **NOTA:** Copia el `notaId`.\
> En este momento se envió internamente la notificación al módulo
> **3003**.
