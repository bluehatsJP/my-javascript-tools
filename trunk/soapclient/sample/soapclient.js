/*****************************************************************************\

 Javascript "SOAP Client" library

 @version: 2.0 - 2011.01.12
 @author: INES uehara
 @description: (1) WSDLのURLをパラメータで受け取る方式に変更
               (2) WebサービスのエンドポイントURLをパラメータで受け取る方式に変更
               (3) SOAPアクションをパラメータで受け取る方式に変更

 @version: 1.4 - 2005.12.10
 @author: Matteo Casati, Ihar Voitka - http://www.guru4.net/
 @description: (1) SOAPClientParameters.add() method returns 'this' pointer.
               (2) "_getElementsByTagName" method added for xpath queries.
               (3) "_getXmlHttpPrefix" refactored to "_getXmlHttpProgID" (full 
                   ActiveX ProgID).
               
 @version: 1.3 - 2005.12.06
 @author: Matteo Casati - http://www.guru4.net/
 @description: callback function now receives (as second - optional - parameter) 
               the SOAP response too. Thanks to Ihar Voitka.
               
 @version: 1.2 - 2005.12.02
 @author: Matteo Casati - http://www.guru4.net/
 @description: (1) fixed update in v. 1.1 for no string params.
               (2) the "_loadWsdl" method has been updated to fix a bug when 
               the wsdl is cached and the call is sync. Thanks to Linh Hoang.
               
 @version: 1.1 - 2005.11.11
 @author: Matteo Casati - http://www.guru4.net/
 @description: the SOAPClientParameters.toXML method has been updated to allow
               special characters ("<", ">" and "&"). Thanks to Linh Hoang.

 @version: 1.0 - 2005.09.08
 @author: Matteo Casati - http://www.guru4.net/
 @notes: first release.

\*****************************************************************************/

function SOAPClientParameters()
{
	var _pl = new Array();
	this.add = function(name, value) 
	{
		_pl[name] = value; 
		return this; 
	}
	this.toXml = function()
	{
		var xml = "";
		for(var p in _pl)
		{
                        if(_pl[p] instanceof SOAPClientParameters)
                        {
                            xml += "<" + p + ">" + _pl[p].toXml() + "</" + p + ">";
                        }
			else if(typeof(_pl[p]) != "function")
                        {
			    xml += "<" + p + ">" + _pl[p].toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</" + p + ">";
                        }
		}
		return xml;	
	}
        this.remove = function(name)
	{
		delete _pl[name];
		return this;
	}
}

function SOAPClient() {}

// private: wsdl cache
SOAPClient_cacheWsdl = new Array();

// public
/*
 * Webサービス起動メソッド
 * @param wsdlurl WSDLのURL
 * @param endpoinurl WebサービスのエンドポイントURL
 * @param soapaction 実行するSOAPアクション
 * @param parameters SOAPアクションのパラメータ
 * @param async 非同期通信フラグ(true:非同期通信、false:非同期通信なし)
 * @param callback コールバック関数
 *
 **/
SOAPClient.invoke = function(wsdlurl, endpointurl, soapaction, parameters, async, callback)
{
        // WSDL読み込み(同期処理)
        SOAPClient._loadWsdl(wsdlurl);

        return SOAPClient._sendSoapRequest(endpointurl, soapaction, parameters, async, callback, SOAPClient_cacheWsdl[wsdlurl]);
}
// public
/*
 * operationのリスト取得メソッド
 * @param wsdlurl WSDLのURL
 * @param portname Webサービスのエンドポイントportname
 *
 **/
SOAPClient.getOperation = function(wsdlurl,portname)
{
        // WSDL読み込み(同期処理)
        SOAPClient._loadWsdl(wsdlurl);
        // portnameからbindingnameを取得
        var bindingname = SOAPClient._getBindingName(SOAPClient_cacheWsdl[wsdlurl],portname);
        if (bindingname.length == 0)
        {
            alert("bindingname not found");
            return "";
        }

        var bindings = SOAPClient._getElementsByTagName(SOAPClient_cacheWsdl[wsdlurl],"wsdl:binding");
        var bindingNodes;
        var operations;
        var operation = new Object();
        var name = "";
        var soapAction = "";
        //alert("operation取得");
        // 2011.06.01 add
        if (bindings.length == 0)
        {
            alert("bindings not found");
            return "";
        }
        // operation取得
        for (var i=0; i<bindings.length; i++)
        {
            if (bindings[i].attributes.getNamedItem("name").nodeValue == bindingname)
            {
                bindingNodes = bindings[i].childNodes;
                for (var j=0; j<bindingNodes.length; j++)
                {
                    if (bindingNodes[j].nodeName == "wsdl:operation")
                    {
                        name = bindingNodes[j].attributes.getNamedItem("name").nodeValue;
                        operations =  bindingNodes[j].childNodes;

                        for (var k=0; k<operations.length; k++)
                        {
                            if (operations[k].nodeName == "soap:operation")
                            {
                                soapAction = operations[k].attributes.getNamedItem("soapAction").nodeValue;
                                break;
                            }
                        }
                        operation[name] = soapAction;
                    }
                }
            }
        }

        //debug
       /*for (var i in operation)
       {
            alert("operationName:" + i);
            alert("operationSoapAction:" + operation[i]);
       }*/

        return operation;
}

// public
/*
 * operationのパラメータリスト取得メソッド
 * @param wsdlurl WSDLのURL
 * @param portname Webサービスのエンドポイントportname
 * @parma operationname パラメータリストを取得するoperation
 *
 **/
SOAPClient.getOperationParams = function(wsdlurl, portname, operationname)
{
    // WSDL読み込み(同期処理)
    SOAPClient._loadWsdl(wsdlurl);

    // portnameからbindingnameを取得
    var bindingname = SOAPClient._getBindingName(SOAPClient_cacheWsdl[wsdlurl],portname);

    if (bindingname.length == 0)
    {
        alert("bindingname not found");
        return "";
    }

    var bindings = SOAPClient._getElementsByTagName(SOAPClient_cacheWsdl[wsdlurl],"wsdl:binding");
    var portTypeName = "";
    // 2011.06.01 add
    if (bindings.length == 0)
    {
        alert("bindings not found");
        return "";
    }
    // portType取得
    for (var i=0; i<bindings.length; i++)
    {
        if (bindings[i].attributes.getNamedItem("name").nodeValue == bindingname)
        {
            portTypeName = SOAPClient._removePrefix(bindings[i].attributes.getNamedItem("type").nodeValue);
            break;
        }
    }
    // debug
    //alert("portTypeName:" + portTypeName);
    // inputmessage取得
    var portTypes = SOAPClient._getElementsByTagName(SOAPClient_cacheWsdl[wsdlurl],"wsdl:portType");
    var portTypeNodes;
    var operationNodes;
    var inputmessage = "";
    for (var i=0; i<portTypes.length; i++)
    {
        if (portTypes[i].attributes.getNamedItem("name").nodeValue == portTypeName)
        {
            portTypeNodes = portTypes[i].childNodes;
            for (var j=0; j<portTypeNodes.length; j++)
            {
                if (portTypeNodes[j].nodeName == "wsdl:operation")
                {
                    if (portTypeNodes[j].attributes.getNamedItem("name").nodeValue == operationname) {

                        operationNodes = portTypeNodes[j].childNodes;
                        for (var k=0; k<operationNodes.length;k++)
                        {
                            if (operationNodes[k].nodeName == "wsdl:input")
                            {
                                inputmessage = SOAPClient._removePrefix(operationNodes[k].attributes.getNamedItem("message").nodeValue);
                            }
                        }
                    }
                }
            }
        }
    }
    // debug
    //alert("inputmessage:" + inputmessage);
    //
    var OperationParams = new Object();
    var messages = SOAPClient._getElementsByTagName(SOAPClient_cacheWsdl[wsdlurl],"wsdl:message");
    var messageNodes;
    var elements;
    var element = "";
    var elementType;
    var elementNodes;
    var complexTypesNodes;
    var complexTypesSeqNodes;
    var type = "";
    var typeName = "";
    for (var i=0; i<messages.length; i++)
    {
        if (messages[i].attributes.getNamedItem("name").nodeValue == inputmessage)
        {
            //alert(inputmessage);
            messageNodes = messages[i].childNodes;
            for (var j=0; j<messageNodes.length; j++)
            {
                if (messageNodes[j].nodeName == "wsdl:part")
                {
                    element = SOAPClient._removePrefix(messageNodes[j].attributes.getNamedItem("element").nodeValue);
                    for (var key in SOAPClient_cacheWsdl)
                    {
                        // debug
                        //alert("SOAPClient_cacheWsdl" + SOAPClient_cacheWsdl[key]);
                        elements = SOAPClient._getElementsByTagName(SOAPClient_cacheWsdl[key],"xs:element");

                        for (var k=0; k<elements.length; k++)
                        {
                            if (elements[k].attributes.getNamedItem("name").nodeValue == element)
                            {
                                // debug
                                //alert(elements[k].attributes.getNamedItem("name").nodeValue);

                                elementType = elements[k].attributes.getNamedItem("type");

                                if (elementType == null)
                                {
                                    elementNodes = elements[k].childNodes;
                                    for (var l=0; l<elementNodes.length; l++)
                                    {
                                        complexTypesNodes = elementNodes[l].childNodes;
                                        for (var m=0; m<complexTypesNodes.length; m++)
                                        {
                                            complexTypesSeqNodes = complexTypesNodes[m].childNodes;
                                            for (var n=0; n<complexTypesSeqNodes.length; n++)
                                            {
                                                // debug
                                                //alert(complexTypesSeqNodes[n].nodeName);
                                                type = SOAPClient._removePrefix(complexTypesSeqNodes[n].attributes.getNamedItem("type").nodeValue);
                                                typeName = complexTypesSeqNodes[n].attributes.getNamedItem("name").nodeValue;
                                                // 接頭辞がxs:の場合
                                                if (type.indexOf("xs:") == 0)
                                                {
                                                    OperationParams[typeName] = "";
                                                }
                                                else
                                                {
                                                    // 再帰呼び出し
                                                    //alert("再帰呼び出し");
                                                    OperationParams[typeName] = SOAPClient._setOperationParams(key, type, new Object);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

   //debug
   /*for (var i in OperationParams)
   {
        alert("OperationParamsName:" + i);
        alert("OperationParamsValue:" + OperationParams[i]);
        if (OperationParams[i] instanceof Object)
        {
            for (var j in OperationParams[i])
            {
                alert("OperationParamsName:" + j);
                alert("OperationParamsValue:" + OperationParams[i][j]);
            }
        }
   }*/

    return OperationParams;
}
// private
// operationparam設定
SOAPClient._setOperationParams = function (wsdlurl,paramType, operationParams)
{
    //var OperationParams = new Object();
    var elements = SOAPClient_cacheWsdl[wsdlurl].documentElement.childNodes;
    var complexTypesAttributes;
    var complexTypesNodes;
    var complexTypesSeqNodes;
    var complexTypesContNodes;
    var complexTypesContExtNodes;
    var type = "";
    var typeName = "";
    // complexTypesを対象とする
    for (var i=0; i<elements.length; i++)
    {
        // 2011.02.01 ロジックの見直しが必要。elementタグにぶつかるまでとするもしくは
        // もっとちゃんとやるなら、XML Schema解析Util探したほうががよいかも。(AriasのWSDLでは問題なしだが)
        if (elements[i].nodeName == "xs:complexType") {
            complexTypesAttributes = elements[i].attributes.getNamedItem("name");

            if (complexTypesAttributes == null || complexTypesAttributes.nodeValue == paramType)
            {
                complexTypesNodes = elements[i].childNodes;
                for (var j=0; j<complexTypesNodes.length; j++)
                {
                    //if (complexTypesNodes[j].nodeName == "xs:sequence")
                    //if (complexTypesNodes[j].nodeName == "xs:sequence" || complexTypesNodes[j].nodeName == "xs:all")
                    if (complexTypesNodes[j].nodeName == "xs:sequence" || complexTypesNodes[j].nodeName == "xs:all" || complexTypesNodes[j].nodeName == "xs:choice")
                    {
                        complexTypesSeqNodes = complexTypesNodes[j].childNodes;
                        for (var k=0; k<complexTypesSeqNodes.length; k++)
                        {
                            // debug
                            //alert(complexTypesSeqNodes[k].nodeName);
                            type = SOAPClient._removePrefix(complexTypesSeqNodes[k].attributes.getNamedItem("type").nodeValue);
                            typeName = complexTypesSeqNodes[k].attributes.getNamedItem("name").nodeValue;
                            // 接頭辞がxs:の場合
                            if (typeName.indexOf("xs:") == 0)
                            {
                                operationParams[typeName] = "";
                            }
                            else
                            {
                                // 再帰呼び出し
                                operationParams[typeName] = SOAPClient._setOperationParams(wsdlurl, type, new Object);
                            }
                        }
                    }
                    else if (complexTypesNodes[j].nodeName == "xs:complexContent")
                    {
                        complexTypesContNodes = complexTypesNodes[j].childNodes;
                        for (var k=0; k<complexTypesContNodes.length; k++)
                        {
                            // 2011.03.28 SoapParamの順序不正対応
                            type = SOAPClient._removePrefix(complexTypesContNodes[k].attributes.getNamedItem("base").nodeValue);
                            SOAPClient._setOperationParams(wsdlurl, type, operationParams);

                            complexTypesContExtNodes = complexTypesContNodes[k].childNodes;
                            for(var l=0; l<complexTypesContExtNodes.length; l++)
                            {
                                complexTypesSeqNodes = complexTypesContExtNodes[l].childNodes;
                                for (var m=0; m<complexTypesSeqNodes.length; m++)
                                {
                                    // debug
                                    //alert(complexTypesSeqNodes[k].nodeName);
                                    type = SOAPClient._removePrefix(complexTypesSeqNodes[m].attributes.getNamedItem("type").nodeValue);
                                    typeName = complexTypesSeqNodes[m].attributes.getNamedItem("name").nodeValue;
                                    // 接頭辞がxs:の場合
                                    if (typeName.indexOf("xs:") == 0)
                                    {
                                        operationParams[typeName] = "";
                                    }
                                    else
                                    {
                                        // 再帰呼び出し
                                        operationParams[typeName] = SOAPClient._setOperationParams(wsdlurl, type, new Object);
                                    }
                                }
                            }
                            // 2011.03.28 SoapParamの順序不正対応
                            //type = SOAPClient._removePrefix(complexTypesContNodes[k].attributes.getNamedItem("base").nodeValue);
                            //SOAPClient._setOperationParams(wsdlurl, type, operationParams);
                        }
                    }
                }
                //debug
                /*for (var i in OperationParams)
                {
                    alert("OperationParamsName:" + i);
                    alert("OperationParams:" + OperationParams[i]);
                }*/
                return operationParams;
            }
        }
    }

    //alert("SOAPClient._setOperationParams elements not found:WSDL = " + wsdlurl);
    return "";
}

// private: invoke async
/*
 * WSDL読み込みメソッド
 * @param wsdlurl WSDLのURL
 *
 **/
SOAPClient._loadWsdl = function(wsdlurl)
{
	// load from cache?
        var wsdl = SOAPClient_cacheWsdl[wsdlurl];
	if(wsdl + "" != "" && wsdl + "" != "undefined")
        {
                // import WSDL読み込み
                SOAPClient._addImportWSDL(wsdl);
                return;
        }
	// get wsdl
	var xmlHttp = SOAPClient._getXmlHttp();
        //xmlHttp.open("GET", wsdlurl, async);
        xmlHttp.open("GET", wsdlurl, false);
        // chrome,Firefox対応(上手くいかず)
        //xmlHttp.open("POST", wsdlurl, false);
        //xmlHttp.overrideMimeType('text/xml');
        //xmlHttp.setRequestHeader("Content-Type" ,"text/xml");
        xmlHttp.send(null);
        SOAPClient_cacheWsdl[wsdlurl] = xmlHttp.responseXML;    // save a copy in cache
        // import WSDL読み込み
        SOAPClient._addImportWSDL(SOAPClient_cacheWsdl[wsdlurl]);
        return;
}
// private: _loadWsdl
/*
 * import WSDL 読み込みメソッド
 * importで定義されているWSDLをキャッシュに追加する。
 * @param wsdl 事前に取得したWSDL
 *
 **/
SOAPClient._addImportWSDL = function(wsdl)
{
        //alert("import WSDL 追加");
        var importElements = SOAPClient._getElementsByTagName(wsdl,"xsd:import");
        var importElement;
        var xmlHttp;
        var importWsdl;

        for (var i=0; i < importElements.length; i++)
        {
           // alert("importElements" + "[" + i + "]" + importElements[i].attributes.getNamedItem("schemaLocation").nodeValue);

            importElement = importElements[i].attributes.getNamedItem("schemaLocation").nodeValue;

            importWsdl = SOAPClient_cacheWsdl[importElement];
	    if(importWsdl + "" != "" && importWsdl + "" != "undefined")
            {
                // debug
                //alert("exit WSDL");
            }
            else
            {
                xmlHttp = SOAPClient._getXmlHttp();
                xmlHttp.open("GET", importElement, false);
                xmlHttp.send(null);
                SOAPClient_cacheWsdl[importElement] = xmlHttp.responseXML;	// save a copy in cache
            }
        }
}
/*
 * Request送信メソッド
 * WebサービスへRequestを送信する。(非同期通信の場合、SOAP REQUESTを返却)
 * @param url 接続先URL
 * @param soapaction 実行するSOAPアクション
 * @param parameters SOAPアクションのパラメータ
 * @param async 非同期通信フラグ(true:非同期通信、false:非同期通信なし)
 * @param callback コールバック関数
 * @param wsdl 取得したWSDL
 *
 **/
SOAPClient._sendSoapRequest = function(url, soapaction, parameters, async, callback, wsdl)
{
        // get namespace
	var ns = (wsdl.documentElement.attributes["targetNamespace"] + "" == "undefined") ? wsdl.documentElement.attributes.getNamedItem("targetNamespace").nodeValue : wsdl.documentElement.attributes["targetNamespace"].value;
        var method = soapaction.substring(soapaction.lastIndexOf("/") + 1, soapaction.length);

        // debug
        // alert("method" + method);
	// build SOAP request
	var sr = 
				"<?xml version=\"1.0\" encoding=\"utf-8\"?>" +
				"<soap:Envelope " +
				"xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
				"xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" " +
				"xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
				"<soap:Body>" +
				"<" + method + " xmlns=\"" + ns + "\">" +
				parameters.toXml() +
				"</" + method + "></soap:Body></soap:Envelope>";
        // debug
       //alert(sr);
	// send request
	var xmlHttp = SOAPClient._getXmlHttp();
        // debug
        //alert(url);
	xmlHttp.open("POST", url, async);

        // debug
        // alert(soapaction);
	xmlHttp.setRequestHeader("SOAPAction", soapaction);
	xmlHttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
	if(async) 
	{
		xmlHttp.onreadystatechange = function() 
		{
			if(xmlHttp.readyState == 4)
                                // debug
                                //alert("xmlHttp.readyState == 4");
				SOAPClient._onSendSoapRequest(method, async, callback, wsdl, xmlHttp);
		}
	}
	xmlHttp.send(sr);
	if (!async)
		return SOAPClient._onSendSoapRequest(method, async, callback, wsdl, xmlHttp);
        // debug
        else
        {
            // 非同期の場合SOAP REQUESTを返却
            return sr;
        }
}
SOAPClient._onSendSoapRequest = function(method, async, callback, wsdl, req)
{
        // debug
        //alert("_onSendSoapRequest start");
	var o = null;
	var nd = SOAPClient._getElementsByTagName(req.responseXML, method + "Result");

        //alert("_onSendSoapRequest" + req.responseText);
	if(nd.length == 0)
	{
                // debug
                //alert("_onSendSoapRequest nd.length == 0");
		if(req.responseXML.getElementsByTagName("faultcode").length > 0)
                {
                        if (!async)
                        {
                            throw new Error(500, req.responseXML.getElementsByTagName("faultstring")[0].childNodes[0].nodeValue);
                        }
                        else
                        {
                            //callback(new Error(500, req.responseXML.getElementsByTagName("faultstring")[0].childNodes[0].nodeValue), req.responseXML);
                            o = new Error(500, req.responseXML.getElementsByTagName("faultstring")[0].childNodes[0].nodeValue);
                        }
                }
	}
	else
		o = SOAPClient._soapresult2object(nd[0], wsdl);
	if(callback)
		//callback(o, req.responseXML);
                callback(o, req.responseText);
                // debug
                //alert("_onSendSoapRequest end");
	if(!async)
		return o;		
}

// private: utils
SOAPClient._getElementsByTagName = function(document, tagName)
{
	try
	{
		// trying to get node omitting any namespaces (latest versions of MSXML.XMLDocument)
		return document.selectNodes(".//*[local-name()=\""+ tagName +"\"]");
	}
	catch (ex) {}
	// old XML parser support
	return document.getElementsByTagName(tagName);
}

SOAPClient._soapresult2object = function(node, wsdl)
{
	return SOAPClient._node2object(node, wsdl);
}
SOAPClient._node2object = function(node, wsdl)
{
	// null node
	if(node == null)
		return null;
	// text node
	if(node.nodeType == 3 || node.nodeType == 4)
		return SOAPClient._extractValue(node, wsdl);
	// leaf node
	if (node.childNodes.length == 1 && (node.childNodes[0].nodeType == 3 || node.childNodes[0].nodeType == 4))
		return SOAPClient._node2object(node.childNodes[0], wsdl);
	var isarray = SOAPClient._getTypeFromWsdl(node.nodeName, wsdl).toLowerCase().indexOf("arrayof") != -1;
	// object node
	if(!isarray)
	{
		var obj = null;
		if(node.hasChildNodes())
			obj = new Object();
		for(var i = 0; i < node.childNodes.length; i++)
		{
			var p = SOAPClient._node2object(node.childNodes[i], wsdl);
			obj[node.childNodes[i].nodeName] = p;
		}
		return obj;
	}
	// list node
	else
	{
		// create node ref
		var l = new Array();
		for(var i = 0; i < node.childNodes.length; i++)
			l[l.length] = SOAPClient._node2object(node.childNodes[i], wsdl);
		return l;
	}
	return null;
}
SOAPClient._extractValue = function(node, wsdl)
{
	var value = node.nodeValue;
	switch(SOAPClient._getTypeFromWsdl(node.parentNode.nodeName, wsdl).toLowerCase())
	{
		default:
		case "s:string":			
			return (value != null) ? value + "" : "";
		case "s:boolean":
			return value+"" == "true";
		case "s:int":
		case "s:long":
			return (value != null) ? parseInt(value + "", 10) : 0;
		case "s:double":
			return (value != null) ? parseFloat(value + "") : 0;
		case "s:datetime":
			if(value == null)
				return null;
			else
			{
				value = value + "";
				value = value.substring(0, value.lastIndexOf("."));
				value = value.replace(/T/gi," ");
				value = value.replace(/-/gi,"/");
				var d = new Date();
				d.setTime(Date.parse(value));										
				return d;				
			}
	}
}
// 属性名から名前空間接頭辞を除く
SOAPClient._removePrefix = function(elementname)
{
    //alert(elementname.substring(elementname.indexOf(":") + 1, elementname.length));
    return elementname.substring(elementname.indexOf(":") + 1, elementname.length);
}
 // portnameからbindingnameを取得
 SOAPClient._getBindingName = function(wsdl,portname) {
    var ports = SOAPClient._getElementsByTagName(wsdl,"wsdl:port");
    var bindingname = "";
    for (var i=0; i<ports.length; i++)
    {
        if (ports[i].attributes.getNamedItem("name").nodeValue == portname)
        {
            // binding属性のtns:を除きbinding名を取得
            bindingname = SOAPClient._removePrefix(ports[i].attributes.getNamedItem("binding").nodeValue);
        }
    }
    
    return bindingname;
}

SOAPClient._getTypeFromWsdl = function(elementname, wsdl)
{
	var ell = wsdl.getElementsByTagName("s:element");	// IE
	if(ell.length == 0)
		ell = wsdl.getElementsByTagName("element");	// MOZ
	for(var i = 0; i < ell.length; i++)
	{
		if(ell[i].attributes["name"] + "" == "undefined")	// IE
		{
			if(ell[i].attributes.getNamedItem("name") != null && ell[i].attributes.getNamedItem("name").nodeValue == elementname && ell[i].attributes.getNamedItem("type") != null) 
				return ell[i].attributes.getNamedItem("type").nodeValue;
		}	
		else // MOZ
		{
			if(ell[i].attributes["name"] != null && ell[i].attributes["name"].value == elementname && ell[i].attributes["type"] != null)
				return ell[i].attributes["type"].value;
		}
	}
	return "";
}
// private: xmlhttp factory
SOAPClient._getXmlHttp = function() 
{
	try
	{
		if(window.XMLHttpRequest) 
		{
			var req = new XMLHttpRequest();
			// some versions of Moz do not support the readyState property and the onreadystate event so we patch it!
			if(req.readyState == null) 
			{
				req.readyState = 1;
				req.addEventListener("load", 
                                                    function()
                                                    {
                                                            req.readyState = 4;
                                                            if(typeof req.onreadystatechange == "function")
                                                                    req.onreadystatechange();
                                                    },
                                                    false);
			}
			return req;
		}
		if(window.ActiveXObject)
			return new ActiveXObject(SOAPClient._getXmlHttpProgID());
	}
	catch (ex) {}
	throw new Error("Your browser does not support XmlHttp objects");
}
SOAPClient._getXmlHttpProgID = function()
{
	if(SOAPClient._getXmlHttpProgID.progid)
		return SOAPClient._getXmlHttpProgID.progid;
	var progids = ["Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
	var o;
	for(var i = 0; i < progids.length; i++)
	{
		try
		{
			o = new ActiveXObject(progids[i]);
			return SOAPClient._getXmlHttpProgID.progid = progids[i];
		}
		catch (ex) {};
	}
	throw new Error("Could not find an installed XML parser");
}
