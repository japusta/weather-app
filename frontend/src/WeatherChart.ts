import { Chart, ChartConfiguration, registerables } from "chart.js";
import "chartjs-adapter-date-fns";

export class WeatherChart {
  public chart: Chart<"line", number[], string>;

  constructor(ctx: CanvasRenderingContext2D) {
    Chart.register(...registerables);

    const config: ChartConfiguration<"line", number[], string> = {
      type: "line",
      data: {
        labels: [], // ["2025-06-02T00:00", "2025-06-02T01:00", …]
        datasets: [
          {
            label: "Температура, °C",
            data: [], // [15.2, 14.8, …]
            borderColor: "#4a90e2",
            backgroundColor: "rgba(74,144,226,0.2)",
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: {
              parser: "yyyy-MM-dd'T'HH:mm",
              unit: "hour",
              displayFormats: {
                hour: "HH:mm"
              }
            },
            title: {
              display: true,
              text: "Время (UTC)"
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "°C"
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return ` ${value}°`;
              }
            }
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  /**
   * обновление данных на графике
   *  timeArr массив меток времени (["2025-06-02T00:00"])
   *  tempArr массив значений температур ([15.2, 14.8])
   *   unit  'C' или 'F' (единицы температукры)
   */
  updateData(timeArr: string[], tempArr: number[], unit: "C" | "F") {
    const dataToPlot = tempArr.map((t) => (unit === "C" ? t : (t * 9) / 5 + 32));

    this.chart.data.labels = timeArr;
    this.chart.data.datasets[0]!.data = dataToPlot;
    this.chart.data.datasets[0]!.label =
      unit === "C" ? "Температура, °C" : "Температура, °F";
    this.chart.options.scales!["y"]!.title!.text = unit === "C" ? "°C" : "°F";

    this.chart.update();
  }
}
