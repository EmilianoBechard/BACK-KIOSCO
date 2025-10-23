USE kioscodb;

SET FOREIGN_KEY_CHECKS = 0;

DROP TRIGGER IF EXISTS trigger_historial_estado;

DROP TABLE IF EXISTS 
DetallePedidos,
Pedidos,
Usuarios,
Perfiles,
Estado,
Productos,
Sucursal,
Categorias,
HistorialPedidos;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE Categorias (
id_categoria INTEGER PRIMARY KEY AUTO_INCREMENT,
categoria VARCHAR(50) UNIQUE
);

CREATE TABLE Productos (
id_producto INTEGER PRIMARY KEY AUTO_INCREMENT,
nombre VARCHAR(50) NOT NULL,
descripcion VARCHAR(300),
id_categoria INTEGER,
stock INTEGER NOT NULL DEFAULT 0,
precio DECIMAL(10,2) NOT NULL,
slug VARCHAR(300),
destacado BOOLEAN DEFAULT FALSE,
carousel BOOLEAN DEFAULT FALSE,
activo BOOLEAN DEFAULT FALSE,
url VARCHAR(200),
public_id VARCHAR(200),
FOREIGN KEY (id_categoria) REFERENCES Categorias(id_categoria)
);

CREATE TABLE Estado (
id_estado INTEGER PRIMARY KEY AUTO_INCREMENT,
detalle_estado VARCHAR(50) NOT NULL
);

CREATE TABLE Perfiles (
id_perfil INTEGER PRIMARY KEY AUTO_INCREMENT,
tipo_perfil VARCHAR(50)
);

CREATE TABLE Usuarios (
id_usuario INTEGER PRIMARY KEY AUTO_INCREMENT,
id_perfil INTEGER,
nombre VARCHAR(100) NOT NULL,
apellido VARCHAR(100) NOT NULL,
telefono VARCHAR(15),
email VARCHAR(150) UNIQUE NOT NULL,
contraseña VARCHAR(255) NOT NULL,
FOREIGN KEY (id_perfil) REFERENCES Perfiles(id_perfil)
);

CREATE TABLE Sucursal (
id_sucursal INTEGER PRIMARY KEY AUTO_INCREMENT,
direccion VARCHAR(100)
);

CREATE TABLE Pedidos (
id_pedido INTEGER PRIMARY KEY AUTO_INCREMENT,
id_usuario INTEGER,
id_sucursal INTEGER,
fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
precio_total DECIMAL(10,2) NOT NULL,
id_estado INTEGER,
FOREIGN KEY (id_estado) REFERENCES Estado(id_estado),
FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal)
);

CREATE TABLE DetallePedidos (
id_detalle_pedido INTEGER PRIMARY KEY AUTO_INCREMENT,
id_pedido INTEGER,
id_producto INTEGER,
cantidad INTEGER NOT NULL,
FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido),
FOREIGN KEY (id_producto) REFERENCES Productos(id_producto)
);

CREATE TABLE HistorialPedidos (
id_historial INTEGER PRIMARY KEY AUTO_INCREMENT,
id_pedido INTEGER,
id_usuario INTEGER,
id_sucursal INTEGER,
precio_total DECIMAL(10,2) NOT NULL,
fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
id_usuario_modificador INTEGER,
id_estado INTEGER,
FOREIGN KEY (id_pedido) REFERENCES Pedidos(id_pedido),
FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario),
FOREIGN KEY (id_usuario_modificador) REFERENCES Usuarios(id_usuario),
FOREIGN KEY (id_sucursal) REFERENCES Sucursal(id_sucursal),
FOREIGN KEY (id_estado) REFERENCES Estado(id_estado)
);

DELIMITER $$

CREATE TRIGGER trigger_historial_estado
AFTER UPDATE ON Pedidos
FOR EACH ROW
BEGIN 
	IF OLD.id_estado <> NEW.id_estado THEN
		INSERT INTO HistorialPedidos (
            id_pedido,
            id_usuario,
            id_sucursal,
            precio_total,
            id_usuario_modificador,
            id_estado
        )
        VALUES (
            OLD.id_pedido,
            OLD.id_usuario,
            OLD.id_sucursal,
            OLD.precio_total,
            @id_usuario_modificador,
            NEW.id_estado
        );
	END IF;
END $$

DELIMITER ;

INSERT INTO Perfiles(tipo_perfil) VALUES 
('Usuario'),
('Admin');

INSERT INTO Estado(detalle_estado) VALUES
('PENDIENTE'),
('EN PROCESO'),
('LISTO'),
('ENTREGADO'),
('CANCELADO');

INSERT INTO Sucursal(direccion) VALUES
('Mar de Ajó');

CREATE INDEX idx_historial_fecha_mod_id ON HistorialPedidos(fecha_modificacion DESC, id_historial DESC);
