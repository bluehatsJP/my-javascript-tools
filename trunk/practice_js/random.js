// max:上限値
// min:下限値
function random1(max, min) {
    if(typeof(max) != "undefined" && typeof(min) != "undefined") {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
        return NaN;
    }
}

// max:上限値
function random2(max) {
    if(typeof(max) != "undefined") {
        return Math.floor(Math.random() * (max + 1));
    } else {
        return NaN;
    }
}