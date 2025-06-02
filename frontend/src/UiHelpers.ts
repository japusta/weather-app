//тут функции которые работают исключительно с DOM, показывая/скрывая лоадер, ошибки и скрывают/показывают контейнеры

/*
 * показывает индикатор загрузки
 */
export function showLoading() {
    const loadingDiv = document.getElementById("loading");
    if (loadingDiv) {
        loadingDiv.classList.remove("hidden");
    }
}

/*
 * скрывает индикатор загрузки
 */
export function hideLoading() {
    const loadingDiv = document.getElementById("loading");
    if (loadingDiv) {
        loadingDiv.classList.add("hidden");
    }
}

/**
 *gоказывает сообщение об ошибке 
 */
export function showError(msg: string) {
    const errorMsg = document.getElementById("errorMsg");
    if (errorMsg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove("hidden");
    }
}

/**
 *cкрывает сообщение об ошибке
 */
export function hideError() {
    const errorMsg = document.getElementById("errorMsg");
    if (errorMsg) {
        errorMsg.classList.add("hidden");
    }
}

//Скрывает все основные блоки вывода

export function hideAllOutputs() {
    const currentWeatherDiv = document.getElementById("currentWeather");
    const dailyForecastDiv = document.getElementById("dailyForecast");
    const chartContainer = document.getElementById("chartContainer");

    if (currentWeatherDiv) {
        currentWeatherDiv.classList.add("hidden");
    }
    if (dailyForecastDiv) {
        dailyForecastDiv.classList.add("hidden");
    }
    if (chartContainer) {
        chartContainer.classList.add("hidden");
    }
}
