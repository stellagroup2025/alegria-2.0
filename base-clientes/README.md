# Base de datos común de clientes

Proyecto de Supabase: `zbcjhcvjnpigesvfyibe` (región París, plan gratuito). El nombre que aparece en el panel es «alegria-2-0»; se puede renombrar en Settings → General sin que cambie nada.

Esta base sirve para **todos los negocios**. Cada negocio es una fila de `negocios` con su `slug`, y todos los datos van separados por negocio.

## Cómo funciona

- **Alegría hoy (`SELLOS = False` en `tools/qr_mesa.py`):** el QR lleva a `qr/unete.html`, un formulario corto que llama a `alta_cliente` y después abre el canal de WhatsApp. `qr/barra.html` es solo para el dueño, con su clave: lista de clientes y descarga en CSV. La tarjeta de sellos está programada, pero apagada.

- **Las tablas están cerradas.** Tienen RLS activado y no hay permisos para `anon`. La web solo puede llamar a las funciones RPC.
- **El cliente** se da de alta desde `qr/sellos.html` con `alta_cliente`. Recibe un código y un token que se guardan en su móvil. Con ellos puede usar `mi_tarjeta`, `mis_preferencias` y `baja_cliente`. Del token solo se guarda su hash.
- **El personal** trabaja desde `qr/barra.html` con la clave del local:
  - funciones de barra: `personal_entrar`, `personal_buscar`, `personal_sellar` y `personal_canjear`;
  - para un cliente que cambió de móvil: `personal_recuperar`;
  - solo con la clave de dueño: `personal_clientes`, que lista y exporta a CSV.
- **Claves:**
  - Se guardan con bcrypt en `claves_personal` y hay dos roles: `barra` y `admin`.
  - Tras 10 fallos en 15 minutos el negocio queda bloqueado 15 minutos.
  - Las de Alegría están en `../.claves-personal.txt`, que está fuera de git y nunca debe subirse.
- **Límites del programa:**
  - un sello por visita (6 h entre sellos; desde la barra se puede forzar);
  - un premio pendiente bloquea nuevos sellos hasta que se entrega;
  - el cupón caduca a los 30 días.
- **Limpieza:** cada noche (`pg_cron`, 04:30) se borran las tarjetas que llevan 2 años sin uso, como promete la política de privacidad.

## Dar de alta otro negocio

Hazlo en el SQL editor de Supabase:

```sql
insert into public.negocios (slug, nombre, sellos_objetivo, premio, horas_entre_sellos)
values ('mi-negocio', 'Mi Negocio', 10, 'Un café gratis', 4);

insert into public.claves_personal (negocio_id, rol, hash, nota)
select id, 'barra', extensions.crypt('CLAVE-BARRA', extensions.gen_salt('bf', 10)), 'camareros' from public.negocios where slug = 'mi-negocio';
insert into public.claves_personal (negocio_id, rol, hash, nota)
select id, 'admin', extensions.crypt('CLAVE-DUENO', extensions.gen_salt('bf', 10)), 'dueño' from public.negocios where slug = 'mi-negocio';
```

En la web del negocio, pon el `slug` en `SUPABASE["negocio"]` (en Alegría está en `tools/qr_mesa.py`). La URL y la clave publicable son las mismas para todos.
