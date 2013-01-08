/**
 * Bombay : make it sketchable
 * @author laziel (iam@laziel.com)
 * @since 2012.07.27
 */
var bombay = (typeof bombay == "undefined") ? {} : bombay;

/**
 * Bombay.Canvas
 */
bombay.Canvas = function(htOptions){
	htOptions = htOptions || {};
	
	this._initElement(htOptions);
	this._initVar(htOptions);
	this._attachEvent();
};

/**
 * 엘리먼트 변수 초기화
 */
bombay.Canvas.prototype._initElement = function(htOptions){
	this._elContainer = (typeof htOptions.elContainer == "string") ? document.getElementById(htOptions.elContainer) : htOptions.elContainer;
	
	// append <canvas> to container
	var nWidth = htOptions.nWidth || 320;
	var nHeight = htOptions.nHeight || 400;
	this._elCanvas = bombay.Util.getNewCanvas(nWidth, nHeight);
	this._elContainer.appendChild(this._elCanvas);
	
	// get canvas offset
	this._htCanvasOffset = bombay.Util.getOffset(this._elCanvas);	
};

/**
 * 변수 초기화
 */
bombay.Canvas.prototype._initVar = function(htOptions){
//	this._aCoords = [];
	this._oBrush = null;
	this._oContext = this._elCanvas.getContext("2d");
	this._htCanvasOffset = bombay.Util.getOffset(this._elCanvas);
	this._nPI2 = Math.PI * 2;
	this._htLastCoord = {};
	
	// use roundPos(). faster but lower quality
	this._bSpeedUp = ("bSpeedUp" in htOptions) ? htOptions.bSpeedUp : false; 
	
	this._htDeviceInfo = bombay.Util.getDeviceInfo(); 
	this._nRatio = this._htDeviceInfo.nRatio;
	this._nWidth = this._elCanvas.width;
	this._nHeight = this._elCanvas.height;
	
	// set default style
	this.setLineColor(htOptions.sStrokeStyle || "#000000");
	this.setLineWidth(htOptions.nLineWidth   || 2);
	
	// event listeners
	var self = this;
	this._fOnTouchStart = function(e){ self._onTouchStart.call(self, bombay.Util.getTouchInfo(e)); };
	this._fOnTouchMove  = function(e){ self._onTouchMove.call(self, bombay.Util.getTouchInfo(e)); };
	this._fOnTouchEnd   = function(e){ self._onTouchEnd.call(self, bombay.Util.getTouchInfo(e)); };	
};

/**
 * initialize event listeners
 */
bombay.Canvas.prototype._attachEvent = function(){
	var htNames = bombay.Util.getTouchEventName();
	this._elCanvas.addEventListener(htNames.start, this._fOnTouchStart);	
	this._elCanvas.addEventListener(htNames.move,  this._fOnTouchMove);
	this._elCanvas.addEventListener(htNames.end,   this._fOnTouchEnd);
	htNames = null;
};

bombay.Canvas.prototype._onTouchStart = function(htInfo){
	this._htCoord = {};
	this.setLineColor(this._sLineColor || "#000000");
};

bombay.Canvas.prototype._onTouchMove = function(htInfo){
	this._drawByTouch(htInfo);
	htInfo.oEvent.preventDefault();
	//htInfo.oEvent.stopPropagation();
	return false;
};

bombay.Canvas.prototype._onTouchEnd = function(htInfo){
	this._drawByTouch(htInfo);
	this._htCoord = {};	
};

/**
 * 선 색깔 지정
 * @param {String} sColor HEX 또는 RGB(A) 색상
 */
bombay.Canvas.prototype.setLineColor = function(sColor){ 
//	this._oContext.strokeStyle = sColor;
	this._oContext.fillStyle = sColor;
	this._sLineColor = sColor;
	if(this._oBrush){
		this._elBrushImage = this._oBrush.setColor(sColor);
	}
};

/**
 * 선 굵기 지정
 * @param {Number} nWidth 소수점 단위 사용 가능
 */
bombay.Canvas.prototype.setLineWidth = function(nWidth){
//	this._oContext.lineWidth = nWidth;
	this._nLineWidth = nWidth;
};

/**
 * 선 색깔 반환
 * @returns {String}
 */
bombay.Canvas.prototype.getLineColor = function(){
	return this._sLineColor;
};

/**
 * 브러시 사용
 * @param {Object} oBrush instance of bombay.Brush
 * @returns {Boolean}
 */
bombay.Canvas.prototype.useBrush = function(oBrush){
	if(oBrush instanceof bombay.Brush === false){
		return false;
	}
	
	this._oBrush = oBrush;
	this._elBrushImage = oBrush.setColor(this.getLineColor()); 
	return true;
};

/**
 * 브러시 사용하지 않음. 현재 사용중인 브러시 정보 삭제
 */
bombay.Canvas.prototype.unuseBrush = function(){
	this._oBrush = this._elBrushImage = null;
};

/**
 * 캔버스 내부 좌표를 반환하는 함수
 * @private
 * @param htInfo
 * @returns {Hash Table}
 */
bombay.Canvas.prototype._getCoordinate = function(htInfo){
	this._htCoord = {
		"nX": htInfo.nX - this._htCanvasOffset.left,
		"nY": htInfo.nY - this._htCanvasOffset.top
	};
	return this._htCoord;
};

/**
 * 터치 이벤트에 따라 현재 설정에 맞추어 선 그리기
 * @private
 * @param {Hash Table} htInfo 이벤트 정보
 */
bombay.Canvas.prototype._drawByTouch = function(htInfo){
    var htCoordFrom = this._htCoord || this._getCoordinate(htInfo);
    var htCoordTo = this._getCoordinate(htInfo);
    
    if(this._oBrush){
        this._drawBrush(htCoordFrom, htCoordTo);    	
    } else {
    	this._drawLine(htCoordFrom, htCoordTo);
    }
};

/**
 * 선 좌표를 정수형으로 보정해서 반환하는 함수
 * 정수형 좌표를 사용하면 선은 거칠어지지만 속도는 빨라진다 (저사양기기 대응용)
 * default : Off
 * @private
 */
bombay.Canvas.prototype._getRoundedPos = function(n){
    return (this._bSpeedUp) ? Math.round(n) : n;
};
    
/**
 * 부드러운 선 그리기
 * @private
 */
bombay.Canvas.prototype._drawLine = function(htCoordFrom, htCoordTo, htOptions){
	var htOptions = htOptions || {};
	var nLineWidth = htOptions.nLineWidth || this._nLineWidth;
	if(this._bIsAndroid){
		nLineWidth = Math.pow(nLineWidth, 1.7);
	}
	var oContext = htOptions.oContext || this._oContext;
	if(htOptions.sColor){
		oContext.fillStyle = htOptions.sColor;
	}
	
	var nX, nY;
	var nDistance = parseInt(bombay.Util.distanceBetween(htCoordFrom, htCoordTo));
	var nAngle = bombay.Util.angleBetween(htCoordFrom, htCoordTo);
	
	oContext.beginPath();
	for (var z=0; (z <= nDistance || z==0); z++) {
		nX = (htCoordFrom.nX + (Math.sin(nAngle) * z) - (nLineWidth / 2)) * this._nRatio;
		nY = (htCoordFrom.nY + (Math.cos(nAngle) * z) - (nLineWidth / 2)) * this._nRatio;
		oContext.arc(this._getRoundedPos(nX), this._getRoundedPos(nY), nLineWidth, 0, this._nPI2);
	}
	oContext.fill();
};

/**
 * 브러시로 선 그리기
 * @private
 */
bombay.Canvas.prototype._drawBrush = function(htCoordFrom, htCoordTo, htOptions){
	// 안드로이드는 브러시로 그리면 이상하게 나온다
	if(this._htDeviceInfo.bIsAndroid){
		return this._drawLine(htCoordFrom, htCoordTo, htOptions);
	}

	var htOptions  = htOptions || {};
	var nLineWidth = htOptions.nLineWidth || this._nLineWidth;
	var oContext   = htOptions.oContext || this._oContext;
	var nBrushSize = (nLineWidth * nLineWidth / 10) * this._elBrushImage.width * this._nRatio;
	
	// iOS bug
	if(this._htDeviceInfo.bIsIOS){
		oContext.drawImage(this._elBrushImage, 0, 0, 1, 1);
	}

	var nX, nY;
	//var nHalfBrushW = this._oBrush.width /2;
	//var nHalfBrushH = this._oBrush.height/2;
	var nDistance = parseInt(bombay.Util.distanceBetween(htCoordFrom, htCoordTo));
	var nAngle = bombay.Util.angleBetween(htCoordFrom, htCoordTo);
	var nGap = (nLineWidth >= 3) ? (nLineWidth / 2) : (nBrushSize / 2);

	for (var z=0; (z <= nDistance || z==0); z++) {
		nX = (htCoordFrom.nX + (Math.sin(nAngle) * z) - nGap) * this._nRatio;
		nY = (htCoordFrom.nY + (Math.cos(nAngle) * z) - nGap) * this._nRatio;
		oContext.drawImage(this._elBrushImage, this._getRoundedPos(nX), this._getRoundedPos(nY), nBrushSize, nBrushSize);
	}
};


/**
 * 문자열로 반환
 * @returns {String}
 */
bombay.Canvas.prototype.toString = function(){
	var sData = this.toDataURL();
	var nIndex = sData.indexOf(",") + 1;
	sData = sData.substring(nIndex);
	
	return sData;
};

/**
 * dataURL 반환
 * @returns {String}
 */
bombay.Canvas.prototype.toDataURL = function(){
	return this._elCanvas.toDataURL("image/png");
};

/**
 * drawImage 인터페이스
 * @param vImage
 * @param nX
 * @param nY
 * @param nWidth
 * @param nHeight
 */
bombay.Canvas.prototype.drawImage = function(vImage, nX, nY, nWidth, nHeight){
	nWidth = nWidth || (this._nWidth * this._nRatio);
	nHeight = nHeight || (this._nHeight * this._nRatio);
	
	return this._oContext.drawImage(vImage, nX, nY, nWidth, nHeight);
};

/**
 * 지우개 모드
 * @param {Boolean} bActivate 지우개 모드 활성화 여부
 */
bombay.Canvas.prototype.eraser = function(bActivate){
	// 지우개 모드
	if(bActivate){
		this._oContext.globalCompositeOperation = "destination-out";
		this._sTmpStyle = this.getLineColor();
		this.setLineColor("#fff");
	} else { // 펜 모드
		this._oContext.globalCompositeOperation = "source-over";
		this.setLineColor(this._sTmpStyle);
		delete this._sTmpStyle;
	}
};

/**
 * 캔버스 영역 전체 지우기
 */
bombay.Canvas.prototype.clear = function(bFireEvent){
	this._oContext.save();
	this._oContext.setTransform(1, 0, 0, 1, 0, 0);
	this._oContext.clearRect(0, 0, this._nWidth * this._nRatio, this._nHeight * this._nRatio);
	this._oContext.restore();
/*	
	if(bFireEvent !== false){
		this.fireEvent("clear");
	}
*/
};

