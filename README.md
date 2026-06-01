# Proyecto-Progra4

# React + TypeScript + Vite

## LINK DE ARCHIVO: ARQUITECTURA DEL PROYECTO EN GENERAL (Abrir con draw.io en caso de mala calidad)

https://drive.google.com/file/d/1LJJSEvvoXD2RDIt7dfe4ky6FTq8X21pe/view?usp=sharing

## LINK DEL DIAGRAMA EN DRAW.IO

https://drive.google.com/file/d/18TzGk96oPv7EidHj54G-D3fofcPrcndJ/view?usp=sharing

## Uso de Inteligencia Artificial

### Análisis de ingreso (Groq - llama-3.3-70b-versatile)

Evalúa cada nuevo superviviente con criterios transparentes:
edad, combate, confianza, salud. Genera reporte ACEPTADO/RECHAZADO/REVISION
con puntuación /100. El operador puede aceptar o corregir la decisión.

### Asignación de cargo (lógica determinista + Groq explicación)

El cargo se decide por reglas JS predefinidas según combate/confianza/salud.
Groq genera la explicación en lenguaje natural. Trazable con asignado_por_ia=TRUE en DB.
