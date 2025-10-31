# 📧 Plantillas de Notificaciones Editables

## 🎯 Descripción

El sistema de plantillas de notificaciones ahora permite **editar los datos de las variables** antes de enviar una notificación. Esto resuelve el problema donde los placeholders como `{{nombre_del_beneficio}}`, `{{comercio_nombre}}`, etc., aparecían sin reemplazar en las notificaciones enviadas.

## ✨ Características Nuevas

### 1. **Selector de Plantillas**
- Al enviar una notificación, puedes seleccionar una plantilla predefinida
- Las plantillas incluyen variables dinámicas como `{{socio_nombre}}`, `{{beneficio_titulo}}`, etc.

### 2. **Editor de Variables**
- Cuando seleccionas una plantilla, se abre un diálogo para editar las variables
- Cada variable tiene su propio campo de texto con:
  - Etiqueta descriptiva (ej: "Socio Nombre")
  - Placeholder con el nombre de la variable (ej: `{{socio_nombre}}`)
  - Campo de texto para ingresar el valor real

### 3. **Vista Previa en Tiempo Real**
- Mientras editas las variables, puedes ver una vista previa del mensaje final
- Los placeholders se reemplazan automáticamente con los valores que ingresas
- Vista previa de la plantilla original vs. la versión editada

## 📝 Cómo Usar

### Paso 1: Acceder al Envío de Notificaciones

Navega a la sección de notificaciones en tu dashboard:
- **Asociación**: Dashboard → Notificaciones → Enviar Notificación
- **Comercio**: Dashboard → Notificaciones → Enviar Notificación

### Paso 2: Seleccionar una Plantilla

1. En el formulario de notificación, busca el campo **"Usar Plantilla (Opcional)"**
2. Haz clic en el selector y elige una de las plantillas disponibles:
   - ✅ Creación de cuenta
   - ⚠️ Vencimiento de cuota
   - 🎉 Nuevo beneficio
   - ✨ Beneficio usado
   - ⚠️ Atraso de cuota

### Paso 3: Editar las Variables

Cuando selecciones una plantilla, se abrirá automáticamente el **"Editor de Variables"**:

```
┌─────────────────────────────────────────────┐
│  Editar Variables de la Plantilla          │
├─────────────────────────────────────────────┤
│                                             │
│  📋 Plantilla: Nuevo beneficio              │
│  Completa los valores de las variables     │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Asociacion Nombre                   │   │
│  │ [Mi Asociación de Comerciantes]    │   │
│  │ Variable: {{asociacion_nombre}}     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Comercio Nombre                     │   │
│  │ [Restaurante El Buen Sabor]        │   │
│  │ Variable: {{comercio_nombre}}       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Beneficio Titulo                    │   │
│  │ [20% de descuento en menú del día] │   │
│  │ Variable: {{beneficio_titulo}}      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Descuento                           │   │
│  │ [20]                                │   │
│  │ Variable: {{descuento}}             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  📄 Vista Previa:                           │
│  ┌─────────────────────────────────────┐   │
│  │ ¡Nuevo beneficio disponible: 20% de│   │
│  │ descuento en menú del día!          │   │
│  │                                     │   │
│  │ Mi Asociación de Comerciantes      │   │
│  │ incorporó un nuevo beneficio en     │   │
│  │ Restaurante El Buen Sabor. 20% de  │   │
│  │ descuento en menú del día con 20%   │   │
│  │ de descuento. ¡Aprovéchalo!        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Cancelar]  [✓ Aplicar Plantilla]        │
└─────────────────────────────────────────────┘
```

### Paso 4: Aplicar la Plantilla

1. Completa todos los campos de variables con los valores reales
2. Revisa la vista previa para asegurarte de que el mensaje se vea correcto
3. Haz clic en **"Aplicar Plantilla"**
4. El título y mensaje se actualizarán automáticamente con los valores reemplazados

### Paso 5: Completar el Envío

1. Selecciona los canales de envío (Email, WhatsApp, App)
2. Elige los destinatarios
3. Haz clic en **"Enviar Notificación"**

## 🎨 Ejemplo Completo

### Plantilla Original:
```
Título: ¡Nuevo beneficio disponible: {{beneficio_titulo}}!

Mensaje: {{asociacion_nombre}} incorporó un nuevo beneficio en 
{{comercio_nombre}}. {{beneficio_titulo}} con {{descuento}}% de 
descuento. ¡Aprovéchalo!
```

### Valores Ingresados:
- `asociacion_nombre`: "Cámara de Comercio de Buenos Aires"
- `comercio_nombre`: "Pizzería Don Antonio"
- `beneficio_titulo`: "2x1 en pizzas grandes"
- `descuento`: "50"

### Resultado Final:
```
Título: ¡Nuevo beneficio disponible: 2x1 en pizzas grandes!

Mensaje: Cámara de Comercio de Buenos Aires incorporó un nuevo 
beneficio en Pizzería Don Antonio. 2x1 en pizzas grandes con 50% 
de descuento. ¡Aprovéchalo!
```

## 🔧 Variables Disponibles

Las siguientes variables están disponibles en las plantillas:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{socio_nombre}}` | Nombre del socio | "Juan Pérez" |
| `{{socio_email}}` | Email del socio | "juan@example.com" |
| `{{numero_socio}}` | Número de socio | "12345" |
| `{{asociacion_nombre}}` | Nombre de la asociación | "Mi Asociación" |
| `{{comercio_nombre}}` | Nombre del comercio | "Restaurante XYZ" |
| `{{beneficio_titulo}}` | Título del beneficio | "20% de descuento" |
| `{{descuento}}` | Porcentaje de descuento | "20" |
| `{{fecha_vencimiento}}` | Fecha de vencimiento | "31/12/2024" |
| `{{monto}}` | Monto en pesos | "1500" |
| `{{fecha_actual}}` | Fecha actual | "15/01/2024" |
| `{{hora_actual}}` | Hora actual | "14:30" |
| `{{enlace}}` | Enlace de acción | "https://..." |

## 💡 Mejores Prácticas

### 1. **Usa Nombres Descriptivos**
- ✅ "Restaurante El Buen Sabor"
- ❌ "rest1"

### 2. **Verifica la Vista Previa**
- Siempre revisa la vista previa antes de aplicar la plantilla
- Asegúrate de que el mensaje tenga sentido y sea gramaticalmente correcto

### 3. **Completa Todas las Variables**
- Si dejas una variable vacía, aparecerá como `[nombre_variable]` en el mensaje
- Ejemplo: Si no completas `{{comercio_nombre}}`, aparecerá `[comercio_nombre]`

### 4. **Personaliza el Mensaje**
- Después de aplicar la plantilla, puedes editar manualmente el título y mensaje
- Esto te permite ajustar el texto según sea necesario

### 5. **Guarda Plantillas Personalizadas**
- Si usas frecuentemente los mismos mensajes, crea tus propias plantillas
- Ve a "Plantillas de Notificaciones" → "Nueva Plantilla"

## 🐛 Solución de Problemas

### Problema: Los placeholders siguen apareciendo

**Causa**: No se completaron las variables antes de enviar

**Solución**:
1. Selecciona la plantilla nuevamente
2. Completa todos los campos de variables
3. Haz clic en "Aplicar Plantilla"
4. Verifica que el título y mensaje ya no tengan `{{variables}}`

### Problema: El mensaje no se ve bien

**Causa**: Valores muy largos o formato incorrecto

**Solución**:
1. Usa valores concisos y descriptivos
2. Revisa la vista previa antes de aplicar
3. Edita manualmente el mensaje después de aplicar la plantilla

### Problema: No veo mis plantillas

**Causa**: Las plantillas no están activas o no existen

**Solución**:
1. Ve a "Plantillas de Notificaciones"
2. Verifica que las plantillas estén marcadas como "Activas"
3. Si no hay plantillas, créalas desde el botón "Nueva Plantilla"

## 📚 Recursos Adicionales

- **Crear Plantillas**: Ve a Dashboard → Notificaciones → Plantillas
- **Gestionar Plantillas**: Edita, duplica o elimina plantillas existentes
- **Historial de Notificaciones**: Revisa las notificaciones enviadas anteriormente

## 🎯 Casos de Uso Comunes

### 1. Notificar Nuevo Beneficio
```
Plantilla: "Nuevo beneficio"
Variables a completar:
- asociacion_nombre
- comercio_nombre
- beneficio_titulo
- descuento
```

### 2. Recordatorio de Cuota
```
Plantilla: "Vencimiento de cuota"
Variables a completar:
- socio_nombre
- fecha_vencimiento
- monto
- asociacion_nombre
```

### 3. Confirmación de Uso de Beneficio
```
Plantilla: "Beneficio usado"
Variables a completar:
- beneficio_titulo
- comercio_nombre
- descuento
```

## 🚀 Próximas Mejoras

- [ ] Auto-completado de variables desde la base de datos
- [ ] Plantillas con imágenes
- [ ] Programación de envíos
- [ ] Estadísticas de apertura y clics
- [ ] Variables condicionales

---

**¿Necesitas ayuda?** Contacta al soporte técnico o consulta la documentación completa en el sistema.
