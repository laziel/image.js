/**
 * Bombay : make it sketchable
 * @author laziel (iam@laziel.com)
 * @since 2012.07.27
 */
var bombay = (typeof bombay == "undefined") ? {} : bombay;

/**
 * Bombay.Brush
 * @param {Hash Table} htOptions
 * @param {String}   htOptions.sImageURL
 * @param {Function} htOptions.fOnLoad
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

/**
 * get loaded brush image
 * @private
 */
bombay.Brush.prototype._loadBrush = function(htOptions){
	var self = this;
	this._elBrushImage = new Image();
	this._elBrushImage.onload = function(){
		self._onLoadBrush.call(self);
	};
	
	// start to load
	this._elBrushImage.src = htOptions.sImageURL; 	
};

/**
 * on brush image loaded
 * @private 
 */
bombay.Brush.prototype._onLoadBrush = function(){
	this._elBrushImage = this._elBrushImage; // set default brush image
	if(typeof this._fOnLoadBrush == "function"){
		this._fOnLoadBrush.apply(this);
	}
};

/**
 * restore to brush image. it makes color as black
 * @returns {Boolean} true 
 */
bombay.Brush.prototype.restore = function(){
	this._sColor = "#000000";
	this._elBrushImage = this._elBrushImage;
	return true;
};

/**
 * get brush colored. see bombay.Canvas.prototype.setLineColor
 * @param {String} sColor ColorCode. HEX or RGB
 * @returns {HTMLElement} elBrushImage colored brush image
 */
bombay.Brush.prototype.setColor = function(sColor){
	// copy brush image to new temporary canvas
	var nWidth = this._elBrushImage.width;
	var nHeight = this._elBrushImage.height;
	var elTmpCanvas = bombay.Util.getNewCanvas(nWidth, nHeight);
	var oTmpContext = elTmpCanvas.getContext("2d");
	oTmpContext.drawImage(this._elBrushImage, 0, 0);
	
	// get image colored
	var htRGB = bombay.Util.getRGBColor(sColor);
	var oData = oTmpContext.getImageData(0, 0, nWidth, nHeight);
	var nLength = nWidth * nHeight * 4;
	
	for(var i =0; i < nLength; i += 4){
		oData.data[i] = htRGB.nRed;
		oData.data[i+1] = htRGB.nGreen;
		oData.data[i+2] = htRGB.nBlue;
		//oData[i+3] = nAlpha;
	}

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
 * get current brush image 
 * interface for bombay.Canvas
 * @returns {HTMLElement}
 */
bombay.Brush.prototype.getBrush = function(){
	return this._elBrushImage;
};

/**
 * free variables
 * interface for bombay.Canvas.prototype.unuseBrush
 */
bombay.Brush.prototype.destroy = function(){
	this._elBrushImage = null;
	this._fOnLoadBrush = null;
};
