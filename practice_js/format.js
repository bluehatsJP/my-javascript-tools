function formatNumber(num, decplaces) {
    // 文字列値が渡された場合を考慮に入れて、変換を行う
    num = parseFloat(num);
    // 正しく変換できたことを確認する
    if(!isNaN(num)) {
        // 10のdecplaces乗を掛ける
        // 結果を整数に四捨五入する
        // 結果を文字列に変換する
        // eval = 式を評価して計算結果を返す
        // Math.pow(a,b) = aのb乗
        var str = "" + Math.round(eval(num) * Math.pow(10,decplaces));
        // 指数表示になった場合は、値が大きすぎるか、小さすぎるために、この関数では扱えない
        if(str.indexOf("e") != -1) {
            return "Out of Range";
        }
        // 値が小さい場合には、
        // 数値の左側に0を追加する
        while(str.length <= decplaces) {
            str = "0" + str;
        }
        // 小数点の位置を計算する
        var decpoint = str.length - decplaces;
        // 結果を組み合わせる：(a)小数点位置までの文字列
        // (b)小数点(c)残りの文字列
        // 最終結果を返す。
        return formatCommas(str.substring(0, decpoint)) + "." + str.substring(decpoint, str.length);
    } else {
        return "NaN";
    }
}

function formatCommas(numString) {
    var re = /(-?\d+)(\d{3})/;
    while(re.test(numString)) {
        numString = numString.replace(re, "$1,$2");
    }
    return numString
}

function stripCommas(numString) {
    var re = /,/g;
    return numString.replace(re, "");
}