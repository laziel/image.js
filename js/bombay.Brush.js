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
	// default color: black
	this._sDefaultColor = htOptions.sDefaultColor || "#000000";  
	this._sColor = this._sDefaultColor; // current brush color
	
	// default brush: empty image
	this._nWidth = 0;
	this._nHeight = 0;
	this._elBrushImage = new Image();
	
	// callback function on load image 
	this._fOnLoadBrush = htOptions.fOnLoad;
};

/**
 * Get loaded brush image
 * @private
 */
bombay.Brush.prototype._loadBrush = function(htOptions){
	var self = this;
	this._elLoadedBrush = new Image();
	this._elLoadedBrush.onload = function(){
		self._onLoadBrush.call(self);
	};
	
	// start to load
	this._elLoadedBrush.src = htOptions.sImageURL; 	
};

/**
 * On brush image loaded
 * @private 
 */
bombay.Brush.prototype._onLoadBrush = function(){
	// set default brush image
	this._elBrushImage = this._elLoadedBrush;
	
	// brush size
	this._nWidth = this._elLoadedBrush.width;
	this._nHeight = this._elLoadedBrush.height;
	
	if(typeof this._fOnLoadBrush == "function"){
		this._fOnLoadBrush.apply(this);
	}
};

/**
 * Restore to brush image. it makes color as black
 * @returns {Boolean} true 
 */
bombay.Brush.prototype.restore = function(){
	this._sColor = "#000000";
	this._elBrushImage = this._elLoadedBrush;
	return true;
};

/**
 * Get brush colored. see bombay.Canvas.prototype.setLineColor
 * @param {String} sColor ColorCode. HEX or RGB
 * @returns {HTMLElement} elBrushImage colored brush image
 */
bombay.Brush.prototype.setColor = function(sColor){
	// empty image
	if(!this._elLoadedBrush){
		return this._elBrushImage;
	}
	// setColor same as default means restore
	if(sColor == this._sDefaultColor){
		this.restore();
		return this._elBrushImage;
	}
	
	var elColoredBrush = this._getBrushColored(sColor);
	this._sColor = sColor;
	this._elBrushImage = elColoredBrush;

	return this._elBrushImage;
};

bombay.Brush.prototype._getBrushColored = function(sColor){
	// copy brush image to new temporary canvas
	var elTmpCanvas = bombay.Util.getNewCanvas(this._nWidth, this._nHeight);
	var oTmpContext = elTmpCanvas.getContext("2d");
	oTmpContext.drawImage(this._elLoadedBrush, 0, 0);
	
	// get image colored
	var htRGB = bombay.Util.getRGBColor(sColor);
	var oData = oTmpContext.getImageData(0, 0, this._nWidth, this._nHeight);
	var nLength = this._nWidth * this._nHeight * 4;
	
	for(var i =0; i < nLength; i += 4){
		oData.data[i] = htRGB.nRed;
		oData.data[i+1] = htRGB.nGreen;
		oData.data[i+2] = htRGB.nBlue;
		//oData[i+3] = nAlpha;
	}

	oTmpContext.putImageData(oData, 0, 0);

	// flush after return
	try {
		return elTmpCanvas;
	} finally {
		elTmpCanvas = oTmpContext = oData = null;
	}
};

/**
 * Get current brush image 
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
	this._elLoadedBrush = null;
	this._fOnLoadBrush = null;
};
