-- =====================================================
-- SEED.SQL — Gestión del Fin
-- EIF209 Programación IV
-- Universidad Nacional Sede Regional Brunca
-- Ejecutar DESPUÉS del DDL completo
-- =====================================================

USE gestion_del_fin;

-- =====================================================
-- 1. CAMPAMENTOS
-- =====================================================

INSERT INTO Campamento (nombre, ubicacion, fecha_fundacion, estado, capacidad_maxima, descripcion, hora_servidor) VALUES
('Base Alfa', 'Zona norte, antigua planta industrial', '2024-01-15', 'ACTIVO', 100, 'Primer campamento establecido. Muros de concreto reforzado.', NOW()),
('Base Beta', 'Zona sur, antiguo centro comercial',    '2024-03-10', 'ACTIVO',  75, 'Segundo campamento. Acceso a recursos alimenticios cercanos.', NOW());

-- =====================================================
-- 2. CARGOS
-- =====================================================

INSERT INTO Cargo (nombre, descripcion, categoria, produccion_comida_diaria, produccion_agua_diaria, es_explorador, min_personas_requeridas) VALUES
('Líder',               'Coordina las operaciones generales del campamento.',    'LIDERAZGO',   0,  0, 0, 1),
('Médico',              'Atiende heridos y enfermos dentro del campamento.',     'SALUD',        0,  0, 0, 1),
('Explorador',          'Sale a buscar recursos y reconocer zonas externas.',    'COMBATE',      5,  3, 1, 2),
('Recolector de Agua',  'Consigue y purifica agua diariamente.',                 'RECOLECCION',  0, 10, 0, 2),
('Cocinero',            'Prepara las raciones diarias para el campamento.',      'RECOLECCION',  8,  0, 0, 1),
('Guardia',             'Protege el perímetro contra amenazas zombie.',          'COMBATE',      0,  0, 0, 3),
('Técnico de Logística','Gestiona el inventario y los traslados de recursos.',   'LOGISTICA',    0,  0, 0, 1);

-- =====================================================
-- 3. PERSONAS — Base Alfa (campamento_id = 1)
-- =====================================================

INSERT INTO Persona (nombre, apellidos, fecha_nacimiento, habilidades_combate, nivel_confianza, estado_salud, esta_en_campamento, fecha_ingreso, campamento_id) VALUES
('Carlos',  'Ramírez Solano', '1990-04-12', 8,  9, 'SANO',   1, '2024-01-15', 1),
('María',   'Jiménez Torres', '1985-09-20', 4, 10, 'SANO',   1, '2024-01-15', 1),
('Diego',   'Mora Vega',      '1995-02-08', 7,  7, 'HERIDO', 1, '2024-02-01', 1),
('Sofía',   'Castro Núñez',   '1998-06-14', 5,  8, 'SANO',   1, '2024-02-10', 1),
('Roberto', 'Vargas Campos',  '1993-11-30', 9,  6, 'SANO',   1, '2024-03-01', 1);

-- =====================================================
-- 4. PERSONAS — Base Beta (campamento_id = 2)
-- =====================================================

INSERT INTO Persona (nombre, apellidos, fecha_nacimiento, habilidades_combate, nivel_confianza, estado_salud, esta_en_campamento, fecha_ingreso, campamento_id) VALUES
('Lucía',   'Pérez Solís',   '1992-07-30', 5, 8, 'SANO',    1, '2024-03-10', 2),
('Andrés',  'Rojas Méndez',  '1988-11-14', 9, 6, 'SANO',    1, '2024-03-10', 2),
('Valeria', 'Brenes Arias',  '1996-03-22', 3, 9, 'ENFERMO', 1, '2024-04-05', 2),
('Miguel',  'Chaves Quirós', '1991-08-17', 6, 7, 'SANO',    1, '2024-04-10', 2);

-- =====================================================
-- 5. USUARIOS
-- Contraseña de todos: password
-- =====================================================

INSERT INTO Usuario (username, password_hash, email, rol_sistema, campamento_id, persona_id) VALUES
('admin_alfa',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@base-alfa.com',      'ADMIN',             1, 1),
('trabajador_alfa', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'trabajador@base-alfa.com', 'TRABAJADOR',        1, 2),
('gestor_alfa',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'gestor@base-alfa.com',     'GESTOR_RECURSOS',   1, 3),
('admin_beta',      '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@base-beta.com',      'ADMIN',             2, 6),
('viajes_beta',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viajes@base-beta.com',     'ENCARGADO_VIAJES',  2, 7);

-- =====================================================
-- 6. ASIGNACIONES DE CARGO
-- persona  cargo  camp  temporal  por_ia
-- =====================================================

INSERT INTO AsignacionCargo (persona_id, cargo_id, campamento_id, es_temporal, asignado_por_ia, motivo) VALUES
(1, 1, 1, 0, 1, 'Alta habilidad de combate y nivel de confianza máximo.'),
(2, 2, 1, 0, 1, 'Perfil orientado a salud. Confianza máxima.'),
(3, 6, 1, 1, 0, 'Temporal mientras se recupera. Cargo original: Explorador.'),
(4, 5, 1, 0, 1, 'Habilidades orientadas a logística y cocina.'),
(5, 3, 1, 0, 1, 'Alta habilidad de combate. Perfil explorador confirmado.'),
(6, 1, 2, 0, 1, 'Líder designada por análisis IA.'),
(7, 7, 2, 0, 1, 'Perfil logístico según historial previo.'),
(8, 2, 2, 0, 1, 'Conocimientos médicos detectados en evaluación de ingreso.'),
(9, 4, 2, 0, 1, 'Asignado a recolección de agua por disponibilidad y capacidad física.');

-- =====================================================
-- 7. DECISIONES DE INGRESO
-- =====================================================

INSERT INTO DecisionIngreso (persona_id, criterios_evaluados, puntuacion_ia, recomendacion_ia, razon_ia, decision_operador, operador_id, fecha_decision) VALUES
(1,
 '{"habilidades_combate":{"valor":8,"peso":0.3,"puntaje":2.4},"nivel_confianza":{"valor":9,"peso":0.4,"puntaje":3.6},"estado_salud":{"valor":"SANO","aprobado":true,"puntaje":1.0},"procedencia":{"valor":"zona_verificada","aprobado":true,"puntaje":0.5}}',
 7.50, 'ACEPTAR', 'Alta puntuación en combate y confianza. Estado de salud óptimo. Procedencia verificada.',
 'ACEPTAR', 1, NOW()),

(3,
 '{"habilidades_combate":{"valor":7,"peso":0.3,"puntaje":2.1},"nivel_confianza":{"valor":7,"peso":0.4,"puntaje":2.8},"estado_salud":{"valor":"HERIDO","aprobado":true,"puntaje":0.5},"procedencia":{"valor":"zona_conocida","aprobado":true,"puntaje":0.5}}',
 5.90, 'ACEPTAR', 'Puntuación aceptable. Estado herido pero no representa riesgo inmediato. Se recomienda seguimiento médico.',
 'ACEPTAR', 1, NOW()),

(8,
 '{"habilidades_combate":{"valor":3,"peso":0.3,"puntaje":0.9},"nivel_confianza":{"valor":9,"peso":0.4,"puntaje":3.6},"estado_salud":{"valor":"ENFERMO","aprobado":false,"puntaje":0.0},"procedencia":{"valor":"zona_verificada","aprobado":true,"puntaje":0.5}}',
 5.00, 'ACEPTAR', 'Confianza alta compensa bajo combate. Enfermedad no contagiosa confirmada. Admisión condicional con cuarentena.',
 'ACEPTAR', 4, NOW());

-- =====================================================
-- 8. LOG DE ACTIVIDAD
-- =====================================================

INSERT INTO LogActividad (usuario_id, campamento_id, accion, entidad_afectada, entidad_id, detalle, ip_origen) VALUES
(1, 1, 'LOGIN',           'Usuario', 1, '{"resultado":"exitoso"}',                  '192.168.1.10'),
(1, 1, 'INGRESO_PERSONA', 'Persona', 1, '{"decision":"ACEPTAR","ia":true}',         '192.168.1.10'),
(4, 2, 'LOGIN',           'Usuario', 4, '{"resultado":"exitoso"}',                  '192.168.1.25'),
(4, 2, 'INGRESO_PERSONA', 'Persona', 8, '{"decision":"ACEPTAR","cuarentena":true}', '192.168.1.25');

-- =====================================================
-- 9. BODEGAS (1:1 con Campamento)
-- =====================================================

INSERT INTO Bodega (campamento_id) VALUES
(1),
(2);

-- =====================================================
-- 10. TIPOS DE RECURSO
-- =====================================================

INSERT INTO TipoRecurso (nombre, unidad, es_consumo_diario, es_vital, descripcion) VALUES
('Comida',       'RACIONES', 1, 1, 'Raciones alimenticias diarias.'),
('Agua',         'LITROS',   1, 1, 'Agua potable purificada.'),
('Munición',     'UNIDADES', 0, 0, 'Balas y proyectiles para defensa.'),
('Medicamentos', 'UNIDADES', 0, 1, 'Antibióticos, analgésicos y suministros médicos.'),
('Higiene',      'UNIDADES', 0, 0, 'Artículos de higiene personal.'),
('Herramientas', 'UNIDADES', 0, 0, 'Herramientas para reparación y construcción.');

-- =====================================================
-- 11. ITEMS DE BODEGA
-- bodega 1 = Base Alfa | bodega 2 = Base Beta
-- recurso: 1=Comida 2=Agua 3=Munición 4=Medicamentos 5=Higiene 6=Herramientas
-- =====================================================

INSERT INTO ItemBodega (bodega_id, tipo_recurso_id, cantidad_actual, cantidad_minima_alerta) VALUES
(1, 1, 150,  30),
(1, 2, 200,  50),
(1, 3, 500, 100),
(1, 4,  80,  20),
(1, 5,  60,  15),
(1, 6,  30,   5),
(2, 1,  90,  30),
(2, 2, 120,  50),
(2, 3,  95, 100),
(2, 4,  40,  20),
(2, 5,  35,  15),
(2, 6,  18,   5);

-- =====================================================
-- 12. MOVIMIENTOS DE BODEGA
-- =====================================================

INSERT INTO MovimientoBodega (bodega_id, tipo_recurso_id, cantidad, tipo_movimiento, origen, registrado_por_usuario_id, nota) VALUES
(1, 1, 150, 'ENTRADA', 'PRODUCCION',     2, 'Stock inicial Base Alfa'),
(1, 2, 200, 'ENTRADA', 'PRODUCCION',     2, 'Stock inicial Base Alfa'),
(1, 1,   5, 'SALIDA',  'CONSUMO_DIARIO', 2, 'Consumo diario 5 personas'),
(2, 1,  90, 'ENTRADA', 'PRODUCCION',     4, 'Stock inicial Base Beta'),
(2, 3,   5, 'SALIDA',  'CONSUMO_DIARIO', 4, 'Uso de munición en defensa perimetral');

-- =====================================================
-- 13. ALERTAS DE RECURSO
-- Base Beta: munición en 95, mínimo 100 → ACTIVA
-- =====================================================

INSERT INTO AlertaRecurso (bodega_id, tipo_recurso_id, cantidad_al_momento, cantidad_minima, estado) VALUES
(2, 3, 95, 100, 'ACTIVA');

-- =====================================================
-- 14. EXPLORACIONES
-- =====================================================

INSERT INTO Exploracion (campamento_id, nombre_mision, fecha_salida, dias_estimados, dias_extra_max, estado, descripcion_zona) VALUES
(1, 'Reconocimiento Norte', '2024-05-10 07:00:00', 3, 1, 'COMPLETADA',  'Zona industrial norte. Posibles suministros médicos y herramientas.'),
(1, 'Búsqueda de Agua',     '2024-06-01 06:00:00', 2, 1, 'PLANIFICADA', 'Río al este del campamento. Alta probabilidad de agua limpia.');

INSERT INTO PersonaExploracion (exploracion_id, persona_id, rol_en_mision, estado_retorno) VALUES
(1, 5, 'LIDER',        'SANO'),
(1, 4, 'EXPLORADOR',   'SANO'),
(2, 5, 'LIDER',         NULL),
(2, 2, 'MEDICO_CAMPO',  NULL);

-- =====================================================
-- 15. SOLICITUD DE RECURSO ENTRE CAMPAMENTOS
-- =====================================================

INSERT INTO SolicitudRecurso (campamento_origen_id, campamento_destino_id, tipo_solicitud, detalle, estado, aprobado_por_usuario_id, fecha_respuesta, nota_respuesta) VALUES
(2, 1, 'RECURSOS',
 '{"recursos":[{"tipo":"Munición","cantidad":50},{"tipo":"Medicamentos","cantidad":10}]}',
 'APROBADA', 1, NOW(), 'Aprobado. Se enviará en el próximo traslado programado.');

-- =====================================================
-- 16. TRASLADO
-- =====================================================

INSERT INTO Traslado (solicitud_id, campamento_origen_id, campamento_destino_id, fecha_salida_programada, estado, detalle_recursos, raciones_viaje) VALUES
(1, 1, 2, '2024-06-05 08:00:00', 'PENDIENTE_SALIDA',
 '{"recursos":[{"tipo":"Munición","cantidad":50},{"tipo":"Medicamentos","cantidad":10}]}', 6);

INSERT INTO PersonaTraslado (traslado_id, persona_id, rol_en_traslado) VALUES
(1, 5, 'ESCOLTA'),
(1, 4, 'LIDER_GRUPO');

-- =====================================================
-- CREDENCIALES DE PRUEBA
-- =====================================================
-- username        | rol               | campamento | contraseña
-- ----------------|-------------------|------------|----------
-- admin_alfa      | ADMIN             | Base Alfa  | password
-- trabajador_alfa | TRABAJADOR        | Base Alfa  | password
-- gestor_alfa     | GESTOR_RECURSOS   | Base Alfa  | password
-- admin_beta      | ADMIN             | Base Beta  | password
-- viajes_beta     | ENCARGADO_VIAJES  | Base Beta  | password
-- =====================================================
