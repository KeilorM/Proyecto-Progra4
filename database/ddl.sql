-- =====================================================
-- DDL — Gestión del Fin
-- EIF209 Programación IV
-- IDs migrados a INT AUTO_INCREMENT
-- =====================================================

CREATE DATABASE IF NOT EXISTS gestion_del_fin
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE gestion_del_fin;

-- =====================================================
-- DOMINIO: CAMPAMENTO
-- =====================================================

CREATE TABLE Campamento (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100)  NOT NULL,
  ubicacion       VARCHAR(255)  NOT NULL,
  fecha_fundacion DATE          NOT NULL,
  estado          ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
  capacidad_maxima INT          NOT NULL,
  descripcion     TEXT,
  hora_servidor   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creado_en       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- DOMINIO: GESTIÓN HUMANA
-- =====================================================

CREATE TABLE Persona (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  nombre              VARCHAR(100)  NOT NULL,
  apellidos           VARCHAR(150)  NOT NULL,
  fecha_nacimiento    DATE          NOT NULL,
  foto_url            VARCHAR(500),
  tarjeta_id_url      VARCHAR(500),
  habilidades_combate TINYINT       NOT NULL DEFAULT 0,
  nivel_confianza     TINYINT       NOT NULL DEFAULT 5,
  estado_salud        ENUM('SANO','HERIDO','ENFERMO','MUERTO') NOT NULL DEFAULT 'SANO',
  esta_en_campamento  TINYINT(1)    NOT NULL DEFAULT 1,
  fecha_ingreso       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  campamento_id       INT           NOT NULL,
  creado_en           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campamento_id) REFERENCES Campamento(id)
) ENGINE=InnoDB;

CREATE TABLE Cargo (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  nombre                   VARCHAR(100)  NOT NULL,
  descripcion              TEXT,
  categoria                ENUM('COMBATE','SALUD','RECOLECCION','LOGISTICA','LIDERAZGO') NOT NULL,
  produccion_comida_diaria DECIMAL(8,2)  NOT NULL DEFAULT 0,
  produccion_agua_diaria   DECIMAL(8,2)  NOT NULL DEFAULT 0,
  es_explorador            TINYINT(1)    NOT NULL DEFAULT 0,
  min_personas_requeridas  INT           NOT NULL DEFAULT 1,
  creado_en                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cargo_nombre (nombre)
) ENGINE=InnoDB;

-- =====================================================
-- USUARIOS
-- =====================================================

CREATE TABLE Usuario (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(80)   NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,
  email          VARCHAR(150)  NOT NULL,
  rol_sistema    ENUM('ADMIN','TRABAJADOR','GESTOR_RECURSOS','ENCARGADO_VIAJES') NOT NULL,
  campamento_id  INT           NOT NULL,
  persona_id     INT           UNIQUE,
  activo         TINYINT(1)    NOT NULL DEFAULT 1,
  ultimo_acceso  DATETIME,
  fecha_creacion DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuario_username (username),
  UNIQUE KEY uq_usuario_email (email),
  FOREIGN KEY (campamento_id) REFERENCES Campamento(id),
  FOREIGN KEY (persona_id)    REFERENCES Persona(id)
) ENGINE=InnoDB;

CREATE TABLE AsignacionCargo (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  persona_id        INT           NOT NULL,
  cargo_id          INT           NOT NULL,
  campamento_id     INT           NOT NULL,
  fecha_inicio      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_fin         DATETIME,
  es_temporal       TINYINT(1)    NOT NULL DEFAULT 0,
  cargo_original_id INT,
  asignado_por_ia   TINYINT(1)    NOT NULL DEFAULT 0,
  motivo            TEXT,
  creado_en         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (persona_id)        REFERENCES Persona(id),
  FOREIGN KEY (cargo_id)          REFERENCES Cargo(id),
  FOREIGN KEY (campamento_id)     REFERENCES Campamento(id),
  FOREIGN KEY (cargo_original_id) REFERENCES Cargo(id)
) ENGINE=InnoDB;

CREATE TABLE DecisionIngreso (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  persona_id          INT           NOT NULL,
  fecha_evaluacion    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  criterios_evaluados JSON          NOT NULL,
  puntuacion_ia       DECIMAL(5,2)  NOT NULL,
  recomendacion_ia    ENUM('ACEPTAR','RECHAZAR') NOT NULL,
  razon_ia            TEXT          NOT NULL,
  decision_operador   ENUM('ACEPTAR','RECHAZAR','PENDIENTE') NOT NULL DEFAULT 'PENDIENTE',
  operador_id         INT,
  fecha_decision      DATETIME,
  creado_en           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (persona_id)  REFERENCES Persona(id),
  FOREIGN KEY (operador_id) REFERENCES Usuario(id)
) ENGINE=InnoDB;

-- =====================================================
-- SEGURIDAD / AUDITORÍA
-- =====================================================

CREATE TABLE LogActividad (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT           NOT NULL,
  campamento_id    INT           NOT NULL,
  accion           VARCHAR(100)  NOT NULL,
  entidad_afectada VARCHAR(100)  NOT NULL,
  entidad_id       INT,
  detalle          JSON,
  fecha            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_origen        VARCHAR(45),
  FOREIGN KEY (usuario_id)    REFERENCES Usuario(id),
  FOREIGN KEY (campamento_id) REFERENCES Campamento(id)
) ENGINE=InnoDB;

-- =====================================================
-- DOMINIO: GESTIÓN DE RECURSOS
-- =====================================================

CREATE TABLE Bodega (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  campamento_id       INT      NOT NULL,
  ultima_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bodega_campamento (campamento_id),
  FOREIGN KEY (campamento_id) REFERENCES Campamento(id)
) ENGINE=InnoDB;

CREATE TABLE TipoRecurso (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(100)  NOT NULL,
  unidad           ENUM('LITROS','KG','UNIDADES','RACIONES') NOT NULL,
  es_consumo_diario TINYINT(1)   NOT NULL DEFAULT 0,
  es_vital         TINYINT(1)    NOT NULL DEFAULT 0,
  descripcion      TEXT,
  icono_url        VARCHAR(500),
  creado_en        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tipo_recurso_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE ItemBodega (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  bodega_id             INT           NOT NULL,
  tipo_recurso_id       INT           NOT NULL,
  cantidad_actual       DECIMAL(10,2) NOT NULL DEFAULT 0,
  cantidad_minima_alerta DECIMAL(10,2) NOT NULL DEFAULT 0,
  ultima_modificacion   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_item_bodega_tipo (bodega_id, tipo_recurso_id),
  FOREIGN KEY (bodega_id)       REFERENCES Bodega(id),
  FOREIGN KEY (tipo_recurso_id) REFERENCES TipoRecurso(id)
) ENGINE=InnoDB;

CREATE TABLE MovimientoBodega (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  bodega_id                INT           NOT NULL,
  tipo_recurso_id          INT           NOT NULL,
  cantidad                 DECIMAL(10,2) NOT NULL,
  tipo_movimiento          ENUM('ENTRADA','SALIDA') NOT NULL,
  origen                   ENUM('CONSUMO_DIARIO','PRODUCCION','EXPLORACION','TRASLADO_ENVIADO','TRASLADO_RECIBIDO') NOT NULL,
  referencia_id            INT           COMMENT 'ID de la entidad origen (Exploracion o Traslado)',
  fecha                    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  registrado_por_usuario_id INT,
  nota                     TEXT,
  FOREIGN KEY (bodega_id)                    REFERENCES Bodega(id),
  FOREIGN KEY (tipo_recurso_id)              REFERENCES TipoRecurso(id),
  FOREIGN KEY (registrado_por_usuario_id)    REFERENCES Usuario(id)
) ENGINE=InnoDB;

CREATE TABLE AlertaRecurso (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  bodega_id              INT           NOT NULL,
  tipo_recurso_id        INT           NOT NULL,
  cantidad_al_momento    DECIMAL(10,2) NOT NULL,
  cantidad_minima        DECIMAL(10,2) NOT NULL,
  fecha_generacion       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado                 ENUM('ACTIVA','ATENDIDA') NOT NULL DEFAULT 'ACTIVA',
  atendida_por_usuario_id INT,
  fecha_atencion         DATETIME,
  FOREIGN KEY (bodega_id)               REFERENCES Bodega(id),
  FOREIGN KEY (tipo_recurso_id)         REFERENCES TipoRecurso(id),
  FOREIGN KEY (atendida_por_usuario_id) REFERENCES Usuario(id)
) ENGINE=InnoDB;

-- =====================================================
-- DOMINIO: OPERACIONES
-- =====================================================

CREATE TABLE Exploracion (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  campamento_id    INT           NOT NULL,
  nombre_mision    VARCHAR(150)  NOT NULL,
  fecha_salida     DATETIME      NOT NULL,
  dias_estimados   INT           NOT NULL,
  dias_extra_max   INT           NOT NULL DEFAULT 0,
  fecha_retorno_real DATETIME,
  estado           ENUM('PLANIFICADA','EN_CURSO','COMPLETADA','FALLIDA') NOT NULL DEFAULT 'PLANIFICADA',
  descripcion_zona TEXT,
  recursos_consumidos JSON,
  recursos_obtenidos  JSON,
  creado_en        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campamento_id) REFERENCES Campamento(id)
) ENGINE=InnoDB;

CREATE TABLE PersonaExploracion (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  exploracion_id INT  NOT NULL,
  persona_id     INT  NOT NULL,
  rol_en_mision  ENUM('LIDER','EXPLORADOR','MEDICO_CAMPO') NOT NULL,
  estado_retorno ENUM('SANO','HERIDO','FALLECIDO'),
  UNIQUE KEY uq_persona_exploracion (exploracion_id, persona_id),
  FOREIGN KEY (exploracion_id) REFERENCES Exploracion(id),
  FOREIGN KEY (persona_id)     REFERENCES Persona(id)
) ENGINE=InnoDB;

CREATE TABLE SolicitudRecurso (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  campamento_origen_id   INT      NOT NULL,
  campamento_destino_id  INT      NOT NULL,
  tipo_solicitud         ENUM('RECURSOS','PERSONAS') NOT NULL,
  detalle                JSON     NOT NULL COMMENT 'JSON con lo solicitado',
  estado                 ENUM('PENDIENTE','APROBADA','RECHAZADA','COMPLETADA') NOT NULL DEFAULT 'PENDIENTE',
  fecha_solicitud        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta        DATETIME,
  aprobado_por_usuario_id INT,
  nota_respuesta         TEXT,
  FOREIGN KEY (campamento_origen_id)     REFERENCES Campamento(id),
  FOREIGN KEY (campamento_destino_id)    REFERENCES Campamento(id),
  FOREIGN KEY (aprobado_por_usuario_id)  REFERENCES Usuario(id)
) ENGINE=InnoDB;

CREATE TABLE Traslado (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  solicitud_id            INT           NOT NULL,
  campamento_origen_id    INT           NOT NULL,
  campamento_destino_id   INT           NOT NULL,
  fecha_salida_programada DATETIME      NOT NULL,
  fecha_llegada_real      DATETIME,
  estado                  ENUM('PENDIENTE_SALIDA','EN_TRANSITO','PENDIENTE_LLEGADA','COMPLETADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE_SALIDA',
  aprobado_salida_por_id  INT,
  aprobado_llegada_por_id INT,
  detalle_recursos        JSON,
  raciones_viaje          DECIMAL(10,2) NOT NULL DEFAULT 0,
  creado_en               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_traslado_solicitud (solicitud_id),
  FOREIGN KEY (solicitud_id)             REFERENCES SolicitudRecurso(id),
  FOREIGN KEY (campamento_origen_id)     REFERENCES Campamento(id),
  FOREIGN KEY (campamento_destino_id)    REFERENCES Campamento(id),
  FOREIGN KEY (aprobado_salida_por_id)   REFERENCES Usuario(id),
  FOREIGN KEY (aprobado_llegada_por_id)  REFERENCES Usuario(id)
) ENGINE=InnoDB;

CREATE TABLE PersonaTraslado (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  traslado_id     INT  NOT NULL,
  persona_id      INT  NOT NULL,
  rol_en_traslado ENUM('ESCOLTA','PASAJERO','LIDER_GRUPO'),
  estado_llegada  ENUM('SANO','HERIDO','FALLECIDO'),
  UNIQUE KEY uq_persona_traslado (traslado_id, persona_id),
  FOREIGN KEY (traslado_id) REFERENCES Traslado(id),
  FOREIGN KEY (persona_id)  REFERENCES Persona(id)
) ENGINE=InnoDB;

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_persona_campamento      ON Persona(campamento_id);
CREATE INDEX idx_usuario_campamento      ON Usuario(campamento_id);
CREATE INDEX idx_exploracion_campamento  ON Exploracion(campamento_id);
CREATE INDEX idx_movimiento_bodega_fecha ON MovimientoBodega(bodega_id, fecha);
CREATE INDEX idx_alerta_estado           ON AlertaRecurso(estado);
CREATE INDEX idx_solicitud_estado        ON SolicitudRecurso(estado);
CREATE INDEX idx_traslado_estado         ON Traslado(estado);
CREATE INDEX idx_log_fecha               ON LogActividad(fecha);
