function dec2Hex(dec) {
    dec = parseInt(dec, 10);
    if(!isNaN(dec)) {
        hexChars = "0123456789ABCDEF";
        if(dec > 255) {
            return "Out Of Range";
        }
        var i = dec % 16;
        var j = (dec - i) / 16;
        result = "0x";
        result += hexChars.charAt(j) + hexChars.charAt(i);
        return result;
    } else {
        return NaN;
    }
}