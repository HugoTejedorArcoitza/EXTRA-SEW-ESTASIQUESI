"use strict";

class MeteorologiaSevilla {
    constructor(seccion) {
        this.seccion = seccion;
        this.actual = this.seccion.find("article").eq(0);
        this.prevision = this.seccion.find("article").eq(1);
        this.url = "https://api.open-meteo.com/v1/forecast?latitude=37.3828&longitude=-5.9732&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FMadrid&forecast_days=7";
    }

    cargar() {
        $.ajax({
            url: this.url,
            dataType: "json",
            timeout: 8000
        }).done((datos) => this.mostrar(datos))
            .fail(() => this.error());
    }

    mostrar(datos) {
        const c = datos.current;
        this.actual.find("p").remove();
        this.actual.append($("<p></p>").text(`Temperatura: ${c.temperature_2m} °C. Humedad: ${c.relative_humidity_2m} %. Viento: ${c.wind_speed_10m} km/h. Estado: ${this.descripcion(c.weather_code)}.`));
        this.prevision.find("p").remove();
        const tabla = $("<table></table>");
        tabla.append($("<caption></caption>").text("Previsión meteorológica semanal"));
        tabla.append($("<thead><tr><th scope=\"col\">Día</th><th scope=\"col\">Temperatura</th><th scope=\"col\">Lluvia</th><th scope=\"col\">Estado</th></tr></thead>"));
        const cuerpo = $("<tbody></tbody>");
        datos.daily.time.forEach((dia, indice) => {
            const fila = $("<tr></tr>");
            fila.append($("<td></td>").text(new Date(dia).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })));
            fila.append($("<td></td>").text(`${datos.daily.temperature_2m_min[indice]} °C / ${datos.daily.temperature_2m_max[indice]} °C`));
            fila.append($("<td></td>").text(`${datos.daily.precipitation_probability_max[indice]} %`));
            fila.append($("<td></td>").text(this.descripcion(datos.daily.weather_code[indice])));
            cuerpo.append(fila);
        });
        tabla.append(cuerpo);
        this.prevision.append(tabla);
    }

    descripcion(codigo) {
        const codigos = {
            0: "cielo despejado",
            1: "principalmente despejado",
            2: "parcialmente nuboso",
            3: "cubierto",
            45: "niebla",
            48: "niebla con escarcha",
            51: "llovizna débil",
            61: "lluvia débil",
            63: "lluvia moderada",
            65: "lluvia intensa",
            80: "chubascos débiles",
            95: "tormenta"
        };
        return codigos[codigo] || "condiciones variables";
    }

    error() {
        this.actual.find("p").text("No se pudo cargar el servicio meteorológico en este momento.");
        this.prevision.find("p").text("La previsión semanal no está disponible temporalmente.");
    }
}

$(function () {
    new MeteorologiaSevilla($("main section").first()).cargar();
});
