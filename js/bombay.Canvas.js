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
 * initialize elements
 */
bombay.Canvas.prototype._initElement = function(htOptions){
	this._elContainer = (typeof htOptions.elContainer == "string") ? document.getElementById(htOptions.elContainer) : htOptions.elContainer;
	
	// append <canvas> to container
	var nWidth = htOptions.nWidth || 100;
	var nHeight = htOptions.nHeight || 100;
	this._elCanvas = bombay.Util.getNewCanvas(nWidth, nHeight);
	this._elContainer.appendChild(this._elCanvas);
	
	// get canvas offset
	this._htCanvasOffset = bombay.Util.getOffset(this._elCanvas);	
	this._nWidth = this._elCanvas.width;
	this._nHeight = this._elCanvas.height;
};

/**
 * initialize variables
 */
bombay.Canvas.prototype._initVar = function(htOptions){
	this._oBrush = null;
	this._oContext = this._elCanvas.getContext("2d");
	this._htCanvasOffset = bombay.Util.getOffset(this._elCanvas);
	this._nPI2 = Math.PI * 2;
	this._htLastCoord = {};
	
	// use roundPos(). faster but lower quality
	this._bSpeedUp = ("bSpeedUp" in htOptions) ? htOptions.bSpeedUp : false; 
	
	this._htDeviceInfo = bombay.Util.getDeviceInfo(); 
	this._nRatio = this._htDeviceInfo.nRatio;
	
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
 * set color of line
 * @param {String} sColor HEX or RGB(A). shortened HEX acceptable.
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
 * set width of line
 * @param {Number} nWidth line width as float. 1.0 ~ 5.0(recommended)  
 */
bombay.Canvas.prototype.setLineWidth = function(nWidth){
//	this._oContext.lineWidth = nWidth;
	this._nLineWidth = nWidth;
};

/**
 * get color of line
 * @returns {String}
 */
bombay.Canvas.prototype.getLineColor = function(){
	return this._sLineColor;
};

/**
 * set to use bombay.Brush
 * @param {Object} oBrush instance of bombay.Brush
 * @returns {Boolean}
 */
bombay.Canvas.prototype.useBrush = function(oBrush){
	if(oBrush instanceof bombay.Brush === false){
		return false;
	}
	
	// Android warning
	if(this._htDeviceInfo.bIsAndroid){
		try {
			var sWarning = "bombay.Brush cannot be used on Android devices";
			("warn" in console) ? console.warn(sWarning) : console.log(sWarning);
		} catch(e){} finally {
			sWarning = null;
		}
	}
	
	this._oBrush = oBrush;
	this._elBrushImage = oBrush.setColor(this.getLineColor()); 
	return true;
};

/**
 * set to unuse current Brush
 */
bombay.Canvas.prototype.unuseBrush = function(){
	if(this._oBrush){ // free memory
		this._oBrush.destroy();
	}
	this._oBrush = this._elBrushImage = null;
};

/**
 * get coordinates on canvas
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
 * draw lines by touch event. called automatically at _onTouchMove and _onTouchEnd 
 * @private
 * @param {Hash Table} htInfo
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
 * returns rounded coordinate position for speed.
 * rounded position value makes line rough but cuts time to process.
 * default : Off
 * @private
 * @param {Number} n
 */
bombay.Canvas.prototype._getRoundedPos = function(n){
    return (this._bSpeedUp) ? Math.round(n) : n;
};
    
/**
 * draw default line without bombay.Brush
 * @private
 * @param {Hash Table} htCoordFrom
 * @param {Hash Table} htCoordTo
 * @param {Hash Table} htOptions
 */
bombay.Canvas.prototype._drawLine = function(htCoordFrom, htCoordTo, htOptions){
	var htOptions  = htOptions || {};
	var oContext   = htOptions.oContext || this._oContext;
	var nLineWidth = htOptions.nLineWidth || this._nLineWidth;
	
	// adjust line width for difference of Android/iOS
	if(this._htDeviceInfo.bIsAndroid){
		nLineWidth = Math.pow(nLineWidth, 1.7);
	}
	// accept temporary line color as option
	// line color will be restored in _onTouchStart
	if(htOptions.sColor){
		oContext.fillStyle = htOptions.sColor;
	}
	
	// draw small circles on touch path
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
 * draw brushed line with bombay.Brush
 * @private
 * @param {Hash Table} htCoordFrom
 * @param {Hash Table} htCoordTo
 * @param {Hash Table} htOptions
 */
bombay.Canvas.prototype._drawBrush = function(htCoordFrom, htCoordTo, htOptions){
	// cannot be activated in Android (~4.1)
	// as brush cannot be colored 
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
 * get canvas data as Base64 string 
 * @returns {String}
 */
bombay.Canvas.prototype.toString = function(){
	var sData = this.toDataURL();
	var nIndex = sData.indexOf(",") + 1;
	sData = sData.substring(nIndex);
	
	return sData;
};

/**
 * interface of canvas.toDataURL
 * @returns {String}
 */
bombay.Canvas.prototype.toDataURL = function(){
	return this._elCanvas.toDataURL("image/png");
};

/**
 * interface of canvas.drawImage
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
 * set eraser mode
 * @param {Boolean} bActivate
 */
bombay.Canvas.prototype.eraser = function(bActivate){
	if(bActivate){	// activate eraser
		this._oContext.globalCompositeOperation = "destination-out";
		this._sTmpStyle = this.getLineColor();
		this.setLineColor("#fff");
	} else {		// deactivate eraser (means using draw mode)
		this._oContext.globalCompositeOperation = "source-over";
		this.setLineColor(this._sTmpStyle);
		delete this._sTmpStyle;
	}
};

/**
 * clear entire canvas area
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

