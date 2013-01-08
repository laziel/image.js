/**
 * Bombay : make it sketchable
 * @author laziel (iam@laziel.com)
 * @since 2012.07.27
 */
var bombay = (typeof bombay == "undefined") ? {} : bombay;

/**
 * Bombay.Brush
 * @example 
 * var oBrush = new bombay.Brush({
 * 	"sImageURL": "brushes/brush.png",
 *  "fOnLoad": function(){
 *  	oCanvas.useBrush(oBrush);
 *  }
 * });
 */
bombay.Brush = function(htOptions){
	htOptions = htOptions || {};

	this._initVar(htOptions);
	this._loadBrush(htOptions);
};

/**
 * Set default variable value
 * @private
 */
bombay.Brush.prototype._initVar = function(htOptions){
	this._sColor = "#000000";   // default: black
	this._elBrushImage = new Image(); // default: empty image
	this._fOnLoadBrush = htOptions.fOnLoad;
};

bombay.Brush.prototype._loadBrush = function(htOptions){
	var self = this;
	this._elBrushImage = new Image();
	this._elBrushImage.onload = function(){
		self._onLoadBrush.call(self);
	};
	
	// start to load
	this._elBrushImage.src = htOptions.sImageURL; 	
};

bombay.Brush.prototype._onLoadBrush = function(){
	this._elBrushImage = this._elBrushImage; // set default brush image
	if(typeof this._fOnLoadBrush == "function"){
		this._fOnLoadBrush.apply(this);
	}
};

/**
 * 처음 기본 브러시 이미지로 되돌림
 * @returns {Boolean} true 
 */
bombay.Brush.prototype.restore = function(){
	this._sColor = "#000000";
	this._elBrushImage = this._elBrushImage;
	return true;
};

/**
 * 브러시를 지정한 색상으로 만들어 반환
 * @param {Object} oBrush 브러시 이미지
 * @param {String} sColor 색상코드
 */
bombay.Brush.prototype.setColor = function(sColor){
	// 브러시 크기와 같은 캔버스를 만들어서 이미지 복제
	var nWidth = this._elBrushImage.width;
	var nHeight = this._elBrushImage.height;

	// copy brush image to new temporary canvas
	var elTmpCanvas = bombay.Util.getNewCanvas(nWidth, nHeight);
	var oTmpContext = elTmpCanvas.getContext("2d");
		oTmpContext.drawImage(this._elBrushImage, 0, 0);
	
	// 픽셀단위 이미지 데이터 조작
	var htRGB = bombay.Util.getRGBColor(sColor);
	var oData = oTmpContext.getImageData(0, 0, nWidth, nHeight);
	var nLength = nWidth * nHeight * 4;
	
	for(var i =0; i < nLength; i += 4){
		oData.data[i] = htRGB.nRed;
		oData.data[i+1] = htRGB.nGreen;
		oData.data[i+2] = htRGB.nBlue;
		//oData[i+3] = nAlpha;
	}

	// 컨텍스트에 반영하고 브러시 이미지 대체
	oTmpContext.putImageData(oData, 0, 0);
	
	// flush after return
	try {
		this._sColor = sColor;
		this._elBrushImage = elTmpCanvas;
		return this._elBrushImage;
	} finally {
		elTmpCanvas = oTmpContext = null;
	}
};

/**
 * 브러시 이미지 반환하는 함수. 
 * bombay.Canvas 에서 사용하기 위한 인터페이스
 * @returns {HTMLElement}
 */
bombay.Brush.prototype.getBrush = function(){
	return this._elBrushImage;
};

bombay.Brush.prototype.destroy = function(){
	this._elBrushImage = null;
};
