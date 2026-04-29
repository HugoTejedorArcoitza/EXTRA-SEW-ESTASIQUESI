"use strict";

class CarruselFotos {
    constructor(seccion, imagenes) {
        this.seccion = seccion;
        this.imagenes = imagenes;
        this.posicion = 0;
        this.figura = this.seccion.find("figure").first();
        this.imagen = this.figura.find("img").first();
        this.pie = this.figura.find("figcaption").first();
        this.botones = this.seccion.find("button");
    }

    iniciar() {
        this.botones.eq(0).on("click", () => this.anterior());
        this.botones.eq(1).on("click", () => this.siguiente());
        this.mostrar();
        window.setInterval(() => this.siguiente(), 6000);
    }

    anterior() {
        this.posicion = (this.posicion + this.imagenes.length - 1) % this.imagenes.length;
        this.mostrar();
    }

    siguiente() {
        this.posicion = (this.posicion + 1) % this.imagenes.length;
        this.mostrar();
    }

    mostrar() {
        const actual = this.imagenes[this.posicion];
        this.imagen.attr("src", actual.src);
        this.imagen.attr("alt", actual.alt);
        this.pie.text(actual.titulo);
    }
}

class NoticiasSevilla {
    constructor(seccion) {
        this.seccion = seccion;
        this.servicio = "https://api.gdeltproject.org/api/v2/doc/doc?query=Sevilla%20turismo&mode=ArtList&format=json&maxrecords=5&sort=hybridrel";
    }

    cargar() {
        $.ajax({
            url: this.servicio,
            dataType: "json",
            timeout: 8000
        }).done((datos) => this.mostrar(datos.articles || []))
            .fail(() => this.mostrarAlternativa());
    }

    mostrar(noticias) {
        this.seccion.find("p").remove();
        if (noticias.length === 0) {
            this.mostrarAlternativa();
            return;
        }
        const lista = $("<ul></ul>");
        noticias.slice(0, 5).forEach((noticia) => {
            const enlace = $("<a></a>").attr("href", noticia.url).text(noticia.title);
            const elemento = $("<li></li>").append(enlace);
            lista.append(elemento);
        });
        this.seccion.append(lista);
    }

    mostrarAlternativa() {
        this.seccion.find("p").remove();
        const lista = $("<ul></ul>");
        [
            "Consulta la agenda turística oficial de Sevilla.",
            "Revisa la meteorología antes de elegir una ruta.",
            "Explora las rutas monumentales y paisajísticas del proyecto."
        ].forEach((texto) => lista.append($("<li></li>").text(texto)));
        this.seccion.append(lista);
    }
}

class Principal {
    constructor() {
        this.secciones = $("main section");
    }

    iniciar() {
        const imagenes = [
            { src: "multimedia/mapa_sevilla.svg", alt: "Mapa de situación de la provincia de Sevilla en Andalucía", titulo: "Mapa de situación de Sevilla" },
            { src: "multimedia/catedral.jpg", alt: "Catedral de Sevilla y Giralda", titulo: "Catedral de Sevilla" },
            { src: "multimedia/alcazar.jpg", alt: "Jardines y arquitectura del Real Alcázar de Sevilla", titulo: "Real Alcázar" },
            { src: "multimedia/santelmo.jpg", alt: "Fachada del Palacio de San Telmo", titulo: "Palacio de San Telmo" },
            { src: "multimedia/santaana.jpg", alt: "Real Parroquia de Santa Ana en Triana", titulo: "Santa Ana de Triana" }
        ];
        new CarruselFotos(this.secciones.eq(1), imagenes).iniciar();
        new NoticiasSevilla(this.secciones.eq(2)).cargar();
    }
}

$(function () {
    new Principal().iniciar();
});
