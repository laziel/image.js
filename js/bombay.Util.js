/**
 * Bombay : make it sketchable
 * @author laziel (iam@laziel.com)
 * @since 2012.07.27
 */
var bombay = (typeof bombay == "undefined") ? {} : bombay;

/**
 * Bombay.Util
 */
bombay.Util = (function(){
	
	var _htVar = {};
	
	function _initVar(){
		_htVar.rxTrim = /\s/g;
		_htVar.rxRgb  = /\d{0,3},\d{0,3},\d{0,3}/;
		
		_htVar.bSafari = (navigator.userAgent.indexOf("Safari") > -1);
		_htVar.bIsIOS =  (navigator.userAgent.indexOf("Mac OS") > -1);
		_htVar.bIsAndroid = (navigator.userAgent.indexOf("Android") > -1);
		_htVar.bIsRetina = _htVar.bIsIOS ? ((window.devicePixelRatio > 1) ? true : false) : false;
		_htVar.nRatio = _htVar.bIsRetina ? (window.devicePixelRatio * window.devicePixelRatio) : 1;
		_htVar.bHasTouchEvent = 'ontouchstart' in window;		
	}

	/**
	 * get device information 
	 * @returns {Hash Table} 
	 */
	function getDeviceInfo(){
		return _htVar; 
	}
	
	/**
	 * get event names to attach
	 * @returns {Hash Table}
	 */
	function getTouchEventName(){
		var htNames = {
			"start": (_htVar.bHasTouchEvent ? "touchstart" : "mousedown"),
			"move" : (_htVar.bHasTouchEvent ? "touchmove"  : "mousemove"),
			"end"  : (_htVar.bHasTouchEvent ? "touchend"   : "mouseup")
		};
		
		try {
			return htNames;
		} finally {
			htNames = null;
		}
	}
	
	/**
	 * get touch event position information
	 * @returns {Hash Table}
	 */
	function getTouchInfo(e){
		var htPos = {"oEvent": e};
		
		if(_htVar.bHasTouchEvent){
			htPos.nX = e.changedTouches[0].pageX;
			htPos.nY = e.changedTouches[0].pageY;
		} else {
			var nLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
			var nTop  = document.body.scrollTop  || document.documentElement.scrollTop;
			htPos.nX = ('pageX' in e ? e.pageX : e.clientX+nLeft-document.body.clientLeft);
			htPos.nY = ('pageY' in e ? e.pageY : e.clientY+nTop -document.body.clientTop);
		}
		
		try {
			return htPos;
		} finally {
			htPos = null;
		}
	}
	
	/**
	 * 빈 캔버스 엘리먼트를 생성해서 반환하는 함수
	 * @param {Number} nWidth
	 * @param {Number} nHeight
	 * @returns {HTMLCanvasElement}
	 */
	function getNewCanvas(nWidth, nHeight){
		var elCanvas = document.createElement("canvas");
		
		if(_htVar.bIsRetina){ // Retina display
			elCanvas.setAttribute("width", nWidth * 2);
			elCanvas.setAttribute("height", nHeight * 2);
			elCanvas.setAttribute("data-realwidth", nWidth);
			elCanvas.setAttribute("data-realheight", nHeight);
			elCanvas.style.width = nWidth + "px";
			elCanvas.style.height = nHeight + "px";
		} else {
			elCanvas.setAttribute("width", nWidth);
			elCanvas.setAttribute("height", nHeight);			
		}

		// for Android GPU acceleration
		if(_htVar.bIsAndroid){
			elCanvas.style["-webkit-transform"] = "translateZ(0)";
		}
		
		return elCanvas;
	}
	
	/**
	 * 공백을 제거한 문자열 반환
	 * @param {String} sStr
	 * @returns {String}
	 */
	function getTrim(sStr){
		return sStr.replace(this.rxTrim, "");
	}
	
	/**
	 * 문자열을 분석된 RGB 값 해시테이블로 반환
	 * @param {String} sColor 색상 rgb(0,0,0) or #123456
	 * @returns {Hash Table}
	 */
	function getRGBColor(sColor){
		// HEX 컬러코드면 RGB로 변환
		sColor = this.getTrim(sColor);
		sColor = (sColor.charAt(0) == "#") ? this.getHEX2RGB(sColor) : sColor;			

		var sRGB = sColor.match(_htVar.rxRgb)[0];
		var aRGB = sRGB.split(",");
		var htRGB = {
			"nRed"  : aRGB[0],
			"nGreen": aRGB[1],
			"nBlue" : aRGB[2]				
		};
		
		return htRGB;
	}

	/**
	 * HEX 색상코드를 RGB 값의 나열로 변환해서 반환하는 함수
	 * @param {String} sColor #FFF or #FFFFFF
	 * @returns {String} 255,255,255
	 */
	function getHEX2RGB(sColor){
		var aRGB = [];
		sColor = sColor.substr(1); // remove #

		// lengthen shortened HEX color code
		if(sColor.length === 3){
			sColor = Array(3).join(sColor.charAt(0)) + Array(3).join(sColor.charAt(1)) + Array(3).join(sColor.charAt(2));
		}

		// make it to RGB expression
		for(var i = 0; i < 6; i += 2){
			aRGB.push(parseInt(sColor[i] + sColor[i+1], 16));
		}

		return aRGB.join(",");
	}

	/**
	 * 지정한 엘리먼트의 오프셋 위치 반환하는 함수
	 * forked jindo.$Element.prototype.offset_get (2.1.0)
	 * @param {HTMLElement} elBase
	 * @returns {Hash Table} {left, top}
	 */
	function getOffset(oEl){
		var oPhantom = null;
		
		var fpSafari = function(oEl) {
			var oPos = { left : 0, top : 0 };
			for (var oParent = oEl, oOffsetParent = oParent.offsetParent; oParent = oParent.parentNode; ) {
				if (oParent.offsetParent) {
					oPos.left -= oParent.scrollLeft;
					oPos.top -= oParent.scrollTop;
				}

				if (oParent == oOffsetParent) {
					oPos.left += oEl.offsetLeft + oParent.clientLeft;
					oPos.top += oEl.offsetTop + oParent.clientTop ;
					if (!oParent.offsetParent) {
						oPos.left += oParent.offsetLeft;
						oPos.top += oParent.offsetTop;
					}

					oOffsetParent = oParent.offsetParent;
					oEl = oParent;
				}
			}

			return oPos;
		};

		var fpOthers = function(oEl) {
			var oPos = { left : 0, top : 0 };
			var oDoc = oEl.ownerDocument || oEl.document || document;
			var oHtml = oDoc.documentElement;
			var oBody = oDoc.body;

			if (oEl.getBoundingClientRect) { // has getBoundingClientRect
				if (!oPhantom) {
					var bHasFrameBorder = (window == top); 
					if(!bHasFrameBorder){ 
						try{ 
							bHasFrameBorder = (window.frameElement && window.frameElement.frameBorder == 1); 
						}catch(e){} 
					}
					oPhantom = { left : 0, top : 0 };
				}

				var box = oEl.getBoundingClientRect();
				if (oEl !== oHtml && oEl !== oBody) {
					oPos.left = box.left - oPhantom.left;
					oPos.top = box.top - oPhantom.top;

					oPos.left += oHtml.scrollLeft || oBody.scrollLeft;
					oPos.top += oHtml.scrollTop || oBody.scrollTop;
				}
			} else if (oDoc.getBoxObjectFor) { // has getBoxObjectFor
				var box = oDoc.getBoxObjectFor(oEl);
				var vpBox = oDoc.getBoxObjectFor(oHtml || oBody);

				oPos.left = box.screenX - vpBox.screenX;
				oPos.top = box.screenY - vpBox.screenY;
			} else {
				for (var o = oEl; o; o = o.offsetParent) {
					oPos.left += o.offsetLeft;
					oPos.top += o.offsetTop;
				}

				for (var o = oEl.parentNode; o; o = o.parentNode) {
					if (o.tagName == 'BODY') break;
					if (o.tagName == 'TR') oPos.top += 2;

					oPos.left -= o.scrollLeft;
					oPos.top -= o.scrollTop;
				}
			}

			return oPos;
		};
		
		try {
			return (_htVar.bSafari ? fpSafari : fpOthers)(oEl);
		} finally {
			fpSafari = fpOthers = oPhantom = null; 
		}
	}
	
	/**
	 * 두 지점 사이의 거리
	 * @param htPoint1
	 * @param htPoint2
	 * @returns {Number}
	 */
	function distanceBetween(htPoint1, htPoint2) {
		var nDx = htPoint2.nX - htPoint1.nX;
		var nDy = htPoint2.nY - htPoint1.nY;
		return Math.sqrt((nDx * nDx) + (nDy * nDy));	
	}

	/**
	 * 두 지점 사이의 각도
	 * @param htPoint1
	 * @param htPoint2
	 * @returns {Number}
	 */
	function angleBetween(htPoint1, htPoint2 ) {
		var nDx = htPoint2.nX - htPoint1.nX;
		var nDy = htPoint2.nY - htPoint1.nY;	
		return Math.atan2(nDx, nDy);
	}
	
	_initVar();
	
	return {
        "angleBetween"     : angleBetween,
        "distanceBetween"  : distanceBetween,
		"getTrim"	 	   : getTrim,
		"getNewCanvas"	   : getNewCanvas,
		"getRGBColor"	   : getRGBColor,
		"getHEX2RGB"       : getHEX2RGB,
		"getOffset"	       : getOffset,
		"getDeviceInfo"    : getDeviceInfo,
		"getTouchInfo"     : getTouchInfo,
        "getTouchEventName": getTouchEventName
	};
})();