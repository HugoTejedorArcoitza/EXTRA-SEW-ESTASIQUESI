"use strict";

class Coordenada {
    constructor(longitud, latitud, altitud) {
        this.longitud = Number(longitud);
        this.latitud = Number(latitud);
        this.altitud = Number(altitud);
    }
}

class MapaKml {
    constructor(contenedor, archivo) {
        this.contenedor = contenedor;
        this.archivo = archivo;
        this.zoom = 15;
    }

    cargar() {
        $.ajax({
            url: `xml/${this.archivo}`,
            dataType: "xml"
        }).done((kml) => this.dibujar(kml))
            .fail(() => this.contenedor.append($("<p></p>").text("No se pudo cargar la planimetría KML.")));
    }

    dibujar(kml) {
        const coordenadas = this.extraerCoordenadas(kml);
        if (coordenadas.length === 0) {
            this.contenedor.append($("<p></p>").text("El archivo KML no contiene coordenadas."));
            return;
        }
        const centro = this.centro(coordenadas);
        this.insertarTeselas(centro);
        this.insertarLinea(coordenadas);
        this.contenedor.append($("<p></p>").text(`Planimetría cargada desde ${this.archivo}`));
    }

    extraerCoordenadas(kml) {
        const nodos = kml.getElementsByTagNameNS("*", "coordinates");
        if (nodos.length === 0) {
            return [];
        }
        return nodos[0].textContent.trim().split(/\s+/).map((par) => {
            const partes = par.split(",");
            return new Coordenada(partes[0], partes[1], partes[2] || 0);
        });
    }

    centro(coordenadas) {
        const suma = coordenadas.reduce((acum, actual) => ({
            longitud: acum.longitud + actual.longitud,
            latitud: acum.latitud + actual.latitud
        }), { longitud: 0, latitud: 0 });
        return {
            longitud: suma.longitud / coordenadas.length,
            latitud: suma.latitud / coordenadas.length
        };
    }

    insertarTeselas(centro) {
        const tile = this.longitudLatitudATesela(centro.longitud, centro.latitud, this.zoom);
        for (let y = -1; y <= 1; y += 1) {
            for (let x = -1; x <= 1; x += 1) {
                const imagen = $("<img />").attr({
                    src: `https://tile.openstreetmap.org/${this.zoom}/${tile.x + x}/${tile.y + y}.png`,
                    alt: "Tesela cartográfica de OpenStreetMap"
                });
                this.contenedor.append(imagen);
            }
        }
    }

    insertarLinea(coordenadas) {
        const puntos = coordenadas.map((punto) => {
            const proyectado = this.proyectar(punto, coordenadas);
            return `${proyectado.x},${proyectado.y}`;
        }).join(" ");
        const svg = $(document.createElementNS("http://www.w3.org/2000/svg", "svg")).attr("viewBox", "0 0 900 660");
        const polyline = $(document.createElementNS("http://www.w3.org/2000/svg", "polyline")).attr({
            points: puntos,
            fill: "none",
            stroke: "#c21807",
            "stroke-width": "8",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
        });
        svg.append(polyline);
        coordenadas.forEach((punto) => {
            const proyectado = this.proyectar(punto, coordenadas);
            const circulo = $(document.createElementNS("http://www.w3.org/2000/svg", "circle")).attr({
                cx: proyectado.x,
                cy: proyectado.y,
                r: 9,
                fill: "#ffffff",
                stroke: "#004f59",
                "stroke-width": 5
            });
            svg.append(circulo);
        });
        this.contenedor.append(svg);
    }

    proyectar(punto, coordenadas) {
        const longitudes = coordenadas.map((c) => c.longitud);
        const latitudes = coordenadas.map((c) => c.latitud);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const margen = 70;
        const ancho = 900 - margen * 2;
        const alto = 660 - margen * 2;
        return {
            x: margen + ((punto.longitud - minLon) / Math.max(maxLon - minLon, 0.0001)) * ancho,
            y: margen + ((maxLat - punto.latitud) / Math.max(maxLat - minLat, 0.0001)) * alto
        };
    }

    longitudLatitudATesela(longitud, latitud, zoom) {
        const latRad = latitud * Math.PI / 180;
        const escala = 2 ** zoom;
        return {
            x: Math.floor((longitud + 180) / 360 * escala),
            y: Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * escala)
        };
    }
}

class RutasTuristicas {
    constructor(seccion) {
        this.seccion = seccion;
    }

    cargar() {
        $.ajax({
            url: "xml/rutas.xml",
            dataType: "xml"
        }).done((xml) => this.mostrar(xml))
            .fail(() => this.seccion.find("p").text("No se pudo cargar el archivo local rutas.xml."));
    }

    mostrar(xml) {
        this.seccion.find("p").remove();
        $(xml).find("ruta").each((indice, elemento) => this.seccion.append(this.crearArticulo($(elemento), indice)));
    }

    crearArticulo(ruta, indice) {
        const articulo = $("<article></article>");
        articulo.append($("<h3></h3>").text(ruta.children("nombre").text()));
        articulo.append($("<p></p>").text(ruta.children("descripcion").text()));
        articulo.append(this.crearListaDatos(ruta));
        articulo.append($("<h4></h4>").text("Referencias"));
        articulo.append(this.crearLista(ruta.find("referencias referencia")));
        articulo.append($("<h4></h4>").text("Hitos"));
        articulo.append(this.crearHitos(ruta));
        articulo.append($("<h4></h4>").text("Planimetría"));
        const mapa = $("<div></div>");
        articulo.append(mapa);
        new MapaKml(mapa, ruta.children("planimetria").text()).cargar();
        articulo.append($("<h4></h4>").text("Altimetría"));
        this.cargarSvg(articulo, ruta.children("altimetria").text(), indice);
        return articulo;
    }

    crearListaDatos(ruta) {
        const lista = $("<dl></dl>");
        const datos = [
            ["Tipo", ruta.children("tipo").text()],
            ["Transporte", ruta.children("transporte").text()],
            ["Inicio", `${ruta.children("lugarInicio").text()}, ${ruta.children("direccionInicio").text()}`],
            ["Fecha y hora", `${ruta.children("fecha").text() || "Flexible"} ${ruta.children("hora").text() || ""}`],
            ["Duración", ruta.children("duracion").text()],
            ["Agencia", ruta.children("agencia").text()],
            ["Personas adecuadas", ruta.children("personas").text()],
            ["Recomendación", `${ruta.children("recomendacion").text()} de 10`]
        ];
        datos.forEach((dato) => {
            lista.append($("<dt></dt>").text(dato[0]));
            lista.append($("<dd></dd>").text(dato[1]));
        });
        return lista;
    }

    crearLista(nodos) {
        const lista = $("<ul></ul>");
        nodos.each((indice, nodo) => {
            const url = $(nodo).text();
            lista.append($("<li></li>").append($("<a></a>").attr("href", url).text(url)));
        });
        return lista;
    }

    crearHitos(ruta) {
        const lista = $("<ol></ol>");
        ruta.find("hito").each((indice, nodo) => {
            const hito = $(nodo);
            const item = $("<li></li>");
            item.append($("<strong></strong>").text(hito.children("nombreHito").text()));
            item.append(document.createTextNode(`: ${hito.children("descripcionHito").text()} Distancia desde el hito anterior: ${hito.children("distanciaAnterior").text()} ${hito.children("distanciaAnterior").attr("unidades")}.`));
            const foto = hito.find("galeriaFotos foto").first().text();
            item.append($("<figure></figure>").append($("<img />").attr({
                src: `multimedia/${foto}`,
                alt: `Fotografía de ${hito.children("nombreHito").text()}`
            })));
            lista.append(item);
        });
        return lista;
    }

    cargarSvg(articulo, archivo, indice) {
        $.ajax({
            url: `xml/${archivo}`,
            dataType: "xml"
        }).done((svg) => {
            const nodo = $(svg.documentElement).attr("aria-label", `Altimetría de la ruta ${indice + 1}`);
            articulo.append(nodo);
        }).fail(() => articulo.append($("<p></p>").text("No se pudo cargar la altimetría SVG.")));
    }
}

$(function () {
    new RutasTuristicas($("main section").first()).cargar();
});
