// Navigator 4用のイベントハンドラ分岐のためのグローバルフラグ
var Nav4 = ((navigator.appName == "Netscape") && (parseInt(navigator.appVersion,10) == 4));

// このウィンドウから開いた現在のモーダルダイアログの情報を格納するオブジェクト
var dialogWin = {};

// Navigator 4のフォーム要素やIEのリンクを
// ダイアログウィンドウが開いている間は機能しないようにする
function deadend() {
    if (dialogWin.win && !dialogWin.win.closed) {
        dialogWin.win.focus();
        return false;
    }
}

// ブラウザによってはリンクが完全に無効化できないので、
// 「無効化」されている間、リンクのonclickとonmouseoutイベントハンドラを保存する
// メインウィンドウが再び有効化されるときに復元する
var linkClicks;

// すべてのフォーム要素とリンクを無効化する
function disableForms() {
    linkClicks = [];
    for (var i = 0; i < document.forms.length; i++) {
        for (var j = 0; j < document.forms[i].elements.length; j++) {
            document.forms[i].elements[j].disabled = true;
        }
    }
    for (i = 0; i < document.links.length; i++) {
        linkClicks[i] = {click:document.links[i].onclick, up:null};
        linkClicks[i].up = document.links[i].onmouseup;
        document.links[i].onclick  = deadend;
        document.links[i].onmouseup = deadend;
        document.links[i].disabled = true;
    }
    window.onforcus = checkModal;
    document.onclick = checkModal;
}

// フォーム要素とリンクを通常の挙動に戻す
function enableForms() {
    for (var i = 0; i < document.forms.length; i++) {
        for (var j = 0; j < document.forms[i].elements.length; j++) {
            document.forms[i].elements[j].disabled = false;
        }
    }
    for (i = 0; i < document.links.length; i++) {
        document.links[i].onclick = linkClicks[i].click;
        document.links[i].onmouseup = linkClicks[i].up;
        document.links[i].disabled = false;
    }
}

// ダイアログが開いている間にフォーム要素に渡るかもしれない
// Navigtorイベントをすべて捕まえる。IEの場合には、フォーム要素を無効する。
function blockEvents() {
    if (Nav4) {
        window.captureEvents(Event.CLICK | Event.MOUSEDOWN | Event.MOUSEUP | Event.FOCUS);
        window.onclick = deadend();
    } else {
        disableForms();
    }
    window.onfocus = checkModal;
}

// ダイアログが閉じた場合に、メインウィンドウのイベント機構を
// 元に戻す。
function unblockEvents() {
    if (Nav4) {
        window.releaseEvents(Event.CLICK | Event.MOUSEDOWN | Event.MOUSEUP | Event.FOCUS);
    } else {
        enableForms();
    }
}

// モーダルダイアログを作成する
// 引数:, 
//  url -- ダイアログに読み込むページ/フレームセットのURL
//  width -- ダイアログウィンドウの幅(ピクセル数)
//  height -- ダイアログウィンドウの高さ(ピクセル数)
//  returnFunc -- (このページの)関数の参照
//                  この関数は、ダイアログから返されたデータに対して処理を行う。
//  args -- [省略可能] ダイアログに渡す必要のあるデータ
function openSimDialog(url, width, height, returnFunc, args) {
    if (!dialogWin.win || (dialogWin.win && dialogWin.win.closed)) {
        // モーダルダイアログオブジェクトのプロパティを初期化する。
        dialogWin.url = url;
        dialogWin.width = width;
        dialogWin.height = height;
        dialogWin.returnFunc = returnFunc;
        dialogWin.args = args;
        dialogWin.returnedValue = "";
        // 名前を一意にする。
        dialogWin.name = (new Date()).getSeconds().toString();
        // ウィンドウの属性を組み立てて、ダイアログを中央に表示しようとする。
        if (window.screenX) {   // Navigator 4以降
            // メインウィンドウの中央に表示する
            dialogWin.left = window.screenX +
                ((window.outerWidth - dialogWin.width) / 2);
            dialogWin.top = window.screenY +
                ((window.outerHeight - dialogWin.height) / 2);
            var attr = "screenX=" + dialogWin.left +
                ",screenY=" + dialogWin.top + ",resizable=no,width=" +
                dialogWin.width + ",height=" + dialogWin.height;
        } else if (window.screenLeft) {   // Windows用のIE 5以降
            // IEのメインウィンドウの（ほぼ）中央に表示する。
            // IE 6以降のCSS互換モードを考慮に入れて、
            // ウィンドウの大きさを見積もることから始める。
            var CSSCompat = (document.compatMode && document.compatMode != "BackCompat");
            window.outerWidth = (CSSCompat) ? document.body.parentElement.clientWidth :
                document.body.clientWidth;
            window.outerHeight = (CSSCompat) ? document.body.parentElement.clientHeight :
                document.body.clilentHeight;
            window.outerHeight -= 80;
            dialogWin.left = parseInt(window.screenLeft +
                (window.outerWidth - dialogWin.width) / 2);
            dialogWin.height = parseInt(window.screenTop +
                (window.outerHeight - dialogWin.height) / 2);
            attr = "left=" + dialogWin.left +
                ",top=" + dialogWin.top + ",resizable=no,width=" +
                dialogWin.width + ",height=" + dialogWin.height;
        } else {    //その他のブラウザ
            // 可能なのは画面上の中央に表示すること
            dialogWin.left = (screen.width - dialogWin.width) / 2;
            dialogWin.top = (screen.height - dialogWin.height) / 2;
            attr = "left=" + dialogWin.left +
                ",top=" + dialogWin.top + ",resizable=no,width=" +
                dialogWin.width + ",height=" + dialogWin.height;
        }
        // ダイアログを作成し、フォーカスを移す
        dialogWin.win = window.open(dialogWin.url, dialogWin.name, attr);
        dialogWin.win.focus();
    } else {
        dialogWin.win.focus();
    }
}

// すべてのフレームのonfocusイベントハンドラから呼び出され、
// ダイアログウィンドウが開いている場合は、ダイアログウィンドウにフォーカスを戻す。
function checkModal() {
    setTimeout("finishChecking()", 50);
    return true;
}

function finishChecking() {
    if (dialogWin.win && !dialogWin.win.closed) {
        dialogWin.win.focus();
    }
}