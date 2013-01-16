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
	// get container element
	this._elContainer = (typeof htOptions.elContainer == "string") ? document.getElementById(htOptions.elContainer) : htOptions.elContainer;
	
	// append <canvas> to container
	var nWidth = htOptions.nWidth || 100;
	var nHeight = htOptions.nHeight || 100;
	this._elCanvas = bombay.Util.getNewCanvas(nWidth, nHeight);
	this._elContainer.appendChild(this._elCanvas);
};

/**
 * initialize variables
 */
bombay.Canvas.prototype._initVar = function(htOptions){
	this._oBrush = null;
	this._oContext = this._elCanvas.getContext("2d");
	this._nWidth = this._elCanvas.width;
	this._nHeight = this._elCanvas.height;
	this._htCanvasOffset = bombay.Util.getOffset(this._elCanvas);
	this._htCoord = {};
	this._bOnDraw = false;
	this._nPI2 = Math.PI*2;
	
	// use speedup mode. faster but lower quality
	this._bSpeedUp = ("bSpeedUp" in htOptions) ? htOptions.bSpeedUp : false; 
	
	// device information
	this._htDeviceInfo = bombay.Util.getDeviceInfo(); 
	this._nRatio = this._htDeviceInfo.nRatio;
	
	// set default style
	this.setLineColor(htOptions.sStrokeStyle || "#000000");
	this.setLineWidth(htOptions.nLineWidth   || 2);	
	this._oContext.lineCap = htOptions.sLineCap || "round";
	
	// event listeners
	var self = this;
	this._fOnTouchStart = function(e){ self._onTouchStart.call(self, bombay.Util.getTouchInfo(e)); };
	this._fOnTouchMove = function(e){ self._onTouchMove.call(self, bombay.Util.getTouchInfo(e)); };
	this._fOnTouchEnd = function(e){ self._onTouchEnd.call(self, bombay.Util.getTouchInfo(e)); };	
};

/**
 * initialize event listeners
 */
bombay.Canvas.prototype._attachEvent = function(){
	var htNames = bombay.Util.getTouchEventName();
	this._elCanvas.addEventListener(htNames.start, this._fOnTouchStart);	
	this._elCanvas.addEventListener(htNames.move, this._fOnTouchMove);
	this._elCanvas.addEventListener(htNames.end, this._fOnTouchEnd);
	this._elCanvas.addEventListener(htNames.cancel, this._fOnTouchEnd);
	htNames = null;
};

bombay.Canvas.prototype._onTouchStart = function(htInfo){
	this._htCoord = {};
	this._bOnDraw = true;
	this.setLineColor(this._sLineColor || "#000000");
};

bombay.Canvas.prototype._onTouchMove = function(htInfo){
	// on PC: prevents mouseover without mousedown
	if(!this._htDeviceInfo.bHasTouchEvent && !this._bOnDraw){
		return false;
	}
	
	this.drawLine(htInfo);
	htInfo.oEvent.preventDefault();
	htInfo.oEvent.stopPropagation();
	return false;
};

bombay.Canvas.prototype._onTouchEnd = function(htInfo){
	this.drawLine(htInfo);
	this._htCoord = {};
	this._bOnDraw = false;
};

/**
 * set color of line
 * @param {String} sColor HEX or RGB(A). shortened HEX acceptable.
 */
bombay.Canvas.prototype.setLineColor = function(sColor){ 
	this._oContext.strokeStyle = sColor;
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
	this._oContext.lineWidth = nWidth;
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
 * Draw lines by coordinations. 
 * called automatically by _onTouchMove and _onTouchEnd in common (with touch event offsets)
 * You can use this manually using 2 arguments(from, to). in this case, coordinations should be internal.
 * @example
 * // by event handler (automatically). you can ignore this usage.
 * _onTouchMove: function(e){
 * 		this.drawLine(bombay.Util.getTouchInfo(e));
 * };
 * 
 * // by manually. this is how you to really use.
 * oCanvas.drawLine({"nX":0, "nY":0}, {"nX":200, "nY":200});
 * @param {Hash Table} htInfoFrom
 * @param {Number} htInfoFrom.nX
 * @param {Number} htInfoFrom.nY
 * @param {Hash Table} htInfoTo (optional)
 * @param {Number} htInfoTo.nX
 * @param {Number} htInfoTo.nY
 */
bombay.Canvas.prototype.drawLine = function(htInfoFrom, htInfoTo){
	var bDefault = (typeof htInfoTo == "undefined"); 
    var htCoordFrom = bDefault ? (this._htCoord || this._getCoordinate(htInfoFrom)) : htInfoFrom;
    var htCoordTo = bDefault ? this._getCoordinate(htInfoFrom) : htInfoTo;
    
    this._oBrush ? this._drawLineBrush(htCoordFrom, htCoordTo) : this._drawLineSimple(htCoordFrom, htCoordTo);
};

/**
 * returns rounded coordinate position for better performance.
 * rounded position value makes line rough but cuts time to process.
 * default : Off
 * @private
 * @param {Number} n
 */
bombay.Canvas.prototype._getRoundedPos = function(n){
    return (this._bSpeedUp) ? Math.round(n) : n;
};
    
/**
 * draw default line without bombay.Brush.
 * @private
 * @param {Hash Table} htCoordFrom
 * @param {Hash Table} htCoordTo
 * @param {Hash Table} htOptions
 */
bombay.Canvas.prototype._drawLineSimple = function(htCoordFrom, htCoordTo, htOptions){
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
		oContext.strokeStyle = htOptions.sColor;
		oContext.fillStyle = htOptions.sColor;
	}
	
	// draw on touch path	
	oContext.save();
	oContext.beginPath();
	
	if(this._bSpeedUp){ // using line on speedUp mode
		var nXFrom = this._getRoundedPos(htCoordFrom.nX) * this._nRatio;
		var nYFrom = this._getRoundedPos(htCoordFrom.nY) * this._nRatio;
		var nXTo = this._getRoundedPos(htCoordTo.nX) * this._nRatio;
		var nYTo = this._getRoundedPos(htCoordTo.nY) * this._nRatio;
		
		oContext.moveTo(nXFrom, nYFrom);
		oContext.lineTo(nXTo, nYTo);
		oContext.stroke();
	} else {			// using arc on default for smoother line
		var nX, nY;
		var nDistance = parseInt(bombay.Util.distanceBetween(htCoordFrom, htCoordTo));
		var nAngle = bombay.Util.angleBetween(htCoordFrom, htCoordTo);
		
		for (var z=0; (z <= nDistance || z==0); z++) {
			nX = (htCoordFrom.nX + (Math.sin(nAngle) * z) - (nLineWidth / 2)) * this._nRatio;
			nY = (htCoordFrom.nY + (Math.cos(nAngle) * z) - (nLineWidth / 2)) * this._nRatio;
			oContext.arc(this._getRoundedPos(nX), this._getRoundedPos(nY), nLineWidth, 0, this._nPI2);
		}
		oContext.fill();		
	}
	
	oContext.closePath();
	oContext.restore();
};

/**
 * draw brushed line with bombay.Brush
 * @private
 * @param {Hash Table} htCoordFrom
 * @param {Hash Table} htCoordTo
 * @param {Hash Table} htOptions
 */
bombay.Canvas.prototype._drawLineBrush = function(htCoordFrom, htCoordTo, htOptions){
	// cannot be activated in Android (~4.1)
	// as brush cannot be colored 
	if(this._htDeviceInfo.bIsAndroid){
		return this._drawLineSimple(htCoordFrom, htCoordTo, htOptions);
	}

	var htOptions  = htOptions || {};
	var nLineWidth = htOptions.nLineWidth || this._nLineWidth;
	var oContext   = htOptions.oContext || this._oContext;
	var nBrushSize = (nLineWidth * nLineWidth / 10) * this._elBrushImage.width * this._nRatio;

	//if(this._htDeviceInfo.bIsIOS){ // iOS bug?
	oContext.drawImage(this._elBrushImage, 0, 0, 1, 1);
	//}/

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
 * @param {Variant} vImage HTMLImageElement or HTMLCanvasElement
 * @param {Number} nX
 * @param {Number} nY
 * @param {Number} nWidth (optional)
 * @param {Number} nHeight (optional)
 */
bombay.Canvas.prototype.drawImage = function(vImage, nX, nY, nWidth, nHeight){
	// nWidth, nHeight can be omitted 
	nWidth = (!nWidth && vImage.width) ? vImage.width : nWidth;
	nHeight = (!nHeight && vImage.height) ? vImage.height : nHeight;
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

