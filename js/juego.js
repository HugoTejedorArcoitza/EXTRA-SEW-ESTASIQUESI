"use strict";

class Pregunta {
    constructor(enunciado, opciones, correcta) {
        this.enunciado = enunciado;
        this.opciones = opciones;
        this.correcta = correcta;
    }
}

class JuegoTuristico {
    constructor(formulario, preguntas) {
        this.formulario = formulario;
        this.preguntas = preguntas;
    }

    iniciar() {
        this.preguntas.forEach((pregunta, indice) => this.formulario.appendChild(this.crearPregunta(pregunta, indice)));
        const boton = document.createElement("button");
        boton.type = "submit";
        boton.textContent = "Finalizar juego";
        this.formulario.appendChild(boton);
        this.formulario.addEventListener("submit", (evento) => this.corregir(evento));
    }

    crearPregunta(pregunta, indice) {
        const grupo = document.createElement("fieldset");
        const leyenda = document.createElement("legend");
        leyenda.textContent = `${indice + 1}. ${pregunta.enunciado}`;
        grupo.appendChild(leyenda);
        pregunta.opciones.forEach((opcion, posicion) => {
            const etiqueta = document.createElement("label");
            const entrada = document.createElement("input");
            entrada.type = "radio";
            entrada.name = `pregunta${indice}`;
            entrada.value = String(posicion);
            etiqueta.appendChild(entrada);
            etiqueta.appendChild(document.createTextNode(` ${opcion}`));
            grupo.appendChild(etiqueta);
        });
        return grupo;
    }

    corregir(evento) {
        evento.preventDefault();
        if (!this.respondidas()) {
            this.mostrarResultado("Debes responder todas las preguntas antes de finalizar.");
            return;
        }
        const aciertos = this.preguntas.reduce((total, pregunta, indice) => {
            const marcada = this.formulario.querySelector(`input[name="pregunta${indice}"]:checked`);
            return total + (Number(marcada.value) === pregunta.correcta ? 1 : 0);
        }, 0);
        this.mostrarResultado(`Puntuación obtenida: ${aciertos} de 10.`);
    }

    respondidas() {
        return this.preguntas.every((pregunta, indice) => this.formulario.querySelector(`input[name="pregunta${indice}"]:checked`));
    }

    mostrarResultado(texto) {
        let resultado = this.formulario.querySelector("output");
        if (!resultado) {
            resultado = document.createElement("output");
            this.formulario.appendChild(resultado);
        }
        resultado.textContent = texto;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const preguntas = [
        new Pregunta("¿Qué provincia protagoniza el proyecto?", ["Cádiz", "Sevilla", "Málaga", "Granada", "Córdoba"], 1),
        new Pregunta("¿Qué sección muestra platos típicos?", ["Juego", "Reservas", "Gastronomía", "Meteorología", "Ayuda"], 2),
        new Pregunta("¿Qué plato aparece en gastronomía?", ["Pulpo a feira", "Gazpacho andaluz", "Fabada", "Marmitako", "Cocido montañés"], 1),
        new Pregunta("¿Qué elemento permite volver al inicio?", ["El título principal", "La tabla", "El vídeo", "La previsión", "La puntuación"], 0),
        new Pregunta("¿Qué archivo alimenta la página de rutas?", ["rutas.xml", "layout.css", "reservas.csv", "index.php", "juego.json"], 0),
        new Pregunta("¿Cuántas preguntas tiene este juego?", ["5", "7", "8", "10", "12"], 3),
        new Pregunta("¿Qué sección muestra la previsión semanal?", ["Rutas", "Meteorología", "Gastronomía", "Inicio", "Reservas"], 1),
        new Pregunta("¿Qué ruta usa bicicleta?", ["Guadalquivir y Parque de María Luisa", "Sevilla Monumental y Triana", "Sevilla de Plazas, Iglesias y Tapas", "Ruta de los molinos", "Ruta de la costa"], 0),
        new Pregunta("¿Qué barrio aparece en la ruta monumental?", ["Triana", "La Calzada", "El Llano", "La Arena", "Somió"], 0),
        new Pregunta("¿Qué sección sirve para registrar y gestionar reservas?", ["Ayuda", "Reservas", "Juego", "Inicio", "Rutas"], 1)
    ];
    new JuegoTuristico(document.querySelector("form"), preguntas).iniciar();
});
