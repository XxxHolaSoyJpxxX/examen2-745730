# Repositorio

https://github.com/XxxHolaSoyJpxxX/examen2-745730.git

# Factores cubiertos durante el desarrollo

## Factor I -- Código base

Separé el código en tres partes: **Catálogos**, **Ventas** y
**Notificaciones**. Cada una funciona por su cuenta 

## Factor V/VIII/IX -- Build, procesos y desechabilidad

Aproveché **Docker** para separar la etapa de compilación del arranque.
Si un contenedor de Ventas se vuelve lento, lo apago y levanto otro. La
idea es que los contenedores sean desechables.

## Factor XI -- Logs

En lugar de manejar logs como texto plano, la aplicación genera eventos
**EMF** para enviarlos a **CloudWatch**, lo que permite revisar métricas
y salud del sistema.

------------------------------------------------------------------------

# Retos al separar las aplicaciones

Separarlas fue sencillo porque ya había trabajado algo similar;
básicamente dividí el proyecto en bloques.\
Lo complicado fue el **build**. Al inicio pensé usar varias Lambdas,
pero terminé usando tres contenedores. Ahí tuve la mayoría de fallas,
casi todas por errores míos al separar el código. JavaScript deja pasar
todo sin avisar; por eso prefiero TypeScript, pero este proyecto venía
en JS.

------------------------------------------------------------------------

# Tarea administrativa recomendada

1.  **Respaldo de DynamoDB**: Si esta fuera una app real, perder la
    información la volvería inutilizable.
2.  **Mover del S3 las notas de más de 5 años** a un almacenamiento más
    barato o local. No las borraría, solo las sacaría de S3 para evitar
    ocupar espacio innecesario.
