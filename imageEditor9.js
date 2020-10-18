const NODE_MOVE   = "move";
const NODE_READY  = "ready";
const NODE_RESIZE = "resize";
const NODE_ROTATE = "rotate";
const MENU_REMOVE = "remove";
const MENU_COLOR  = "color";
const MENU_EDIT   = "edit";
const MENU_LOCK   = "lock";

const TYPE_BACK  = 0;   // background image, user photo
const TYPE_IMAGE = 1;   // topper image
const TYPE_TEXT  = 2;   // topper text
const FONTSIZE   = 80;

const DIRECT_NONE = 0;
const DIRECT_HORIZON = 1;
const DIRECT_VERTICAL = 2;

var util9 = {
    getStyle: function(src, style) {
          if(document.defaultView && document.defaultView.getComputedStyle){
            return document.defaultView.getComputedStyle(src, null).getPropertyValue(style);
        }else if(src.currentStyle){
            return src.currentStyle[style];
        }
        return null;
    },
    getStyleI: function(src, style){
        return parseInt(this.getStyle(src, style));
    },    
  toArray: function(C) {
    var B = C.length,
        A = new Array(B);
    while (B--) {
        A[B] = C[B];
    }
    return A;
  },
  clone: function (obj) {
    if (obj === null || typeof(obj) !== 'object') return obj;

    var copy = obj.constructor();

    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) {
        copy[attr] = obj[attr];
      }
    }
    return copy;
  },
  addEvent: function(obj, evName, evHandler) {
      if (obj.addEventListener) {
          obj.addEventListener(evName, evHandler, false);
      }else {
          obj.attachEvent("on" + evName, evHandler);
      }
  },
  byte_length: function(str) {
    var count = 0;
    var ch = '';
    for(var i = 0; i < str.length; i++) {
      ch = str.charAt(i);
      if(escape(ch).length == 6) {
          count ++;
      } 
      count ++;           
    }        
    return count;
  },
  getAngle: function(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  },
  inputText: function(text) {
    var str = text, len=0;
    do {
      str = prompt('인쇄할 문자열을 입력하세요', str); 
      if (!str) break;
      len = util9.byte_length(str);
      if (len>60) alert("인쇄할 문자열이 너무 깁니다.\n한글30/영문60자 이내로 입력하세요.")
    } while ( len>60 )
  
    return str;
  },
  isInRect: function(x, y, node){
    // rotate the mouse position versus the rotationPoint
    var cx = node.left+node.width/2;
    var cy = node.top+node.height/2;
    var dx=x-cx;
    var dy=y-cy;
    var mouseAngle=Math.atan2(dy,dx);
    var mouseDistance=Math.sqrt(dx*dx+dy*dy);
    var rotatedMouseX=cx+mouseDistance*Math.cos(mouseAngle-node.angle);
    var rotatedMouseY=cy+mouseDistance*Math.sin(mouseAngle-node.angle);
    // test if rotated mouse is inside rotated rect
    var mouseIsInside=rotatedMouseX>node.left &&
        rotatedMouseX<node.left+node.width &&
        rotatedMouseY>node.top &&
        rotatedMouseY<node.top+node.height;
    // draw a dot at the unrotated mouse position
    // green if inside rect, otherwise red
    return mouseIsInside;
  },
  isInRectMenu: function(x, y, node, marginLeft){
    var cx = node.left+node.width/2;
    var cy = node.top+node.height/2;
    var dx=x-cx;
    var dy=y-cy;
    var mouseAngle=Math.atan2(dy,dx);
    var mouseDistance=Math.sqrt(dx*dx+dy*dy);
    var rotatedMouseX=cx+mouseDistance*Math.cos(mouseAngle-node.angle);
    var rotatedMouseY=cy+mouseDistance*Math.sin(mouseAngle-node.angle);
    var mouseIsInside=rotatedMouseX>node.left+marginLeft-FONTSIZE &&
        rotatedMouseX<node.left+marginLeft &&
        rotatedMouseY>node.top-FONTSIZE &&
        rotatedMouseY<node.top;
    return mouseIsInside;
  },
  getSlope: function (x1, y1, x2, y2) {  
    var nX = Math.abs(x1 - x2);
    var nY = Math.abs(y1 - y2);
    var nDis = nX + nY;

    if(nDis < 20) { return -1 }

    return parseFloat((nY / nX).toFixed(2), 10);
  }
}    

Function.prototype.closureListener = function() {
  var A = this,
      C = util9.toArray(arguments), 
      B = C.shift();
  return function(E) {
      E = E || window.event;
      if (E.target) {
          var D = E.target;
      } else {
          var D = E.srcElement;
      }
      return A.apply(B, [E, D].concat(C));
  };
};

const imageEditor9_base_slope = ((window.innerHeight / 2) / window.innerWidth).toFixed(2) * 1;

const ImageEditor9_initInfo = {type:TYPE_BACK, angle:0, zoom:1, left: -130, top: -30, lock: false} 

function ImageEditor9(target) {
  if (!target) return;
  
  this.workDiv = target;
  this.workDiv.classList.add("imageEditor9");
  this.elementList = [];
  this.actionType = null;
  this.activeNode = null;
  this.canvasZoom = 1;
  this.imgInfo = util9.clone(ImageEditor9_initInfo);
  this.userPhoto = null;
  this.backImg = this.backCanvas = this.backCtx = null;
  this.lockImg = document.createElement('img');
  //this.lockImg.src = "/images/lock.png";
  this.unlockImg = document.createElement('img');
  //this.unlockImg.src = "/images/unlock.png";
  
  this.workCanvas = document.createElement('canvas');
  this.workCtx = this.workCanvas.getContext('2d');
  target.appendChild(this.workCanvas);
  this.workCanvas.classList.add("workCanvas");

  this.backCanvas = document.createElement('canvas');
  this.backCtx = this.backCanvas.getContext("2d");

  util9.addEvent(this.workCanvas, "mousemove", this.mousemove4canvas.closureListener(this));
  util9.addEvent(this.workCanvas, "mousedown", this.mousedown4canvas.closureListener(this));
  util9.addEvent(this.workCanvas, "mouseup",   this.stopMoving.closureListener(this));

  util9.addEvent(document, "mouseup", this.stopMoving.closureListener(this));

  util9.addEvent(this.workCanvas, "touchstart", this.touchstart.closureListener(this));
  util9.addEvent(this.workCanvas, "touchmove",  this.touchmove.closureListener(this));
  util9.addEvent(this.workCanvas, "touchend",   this.stopMoving.closureListener(this));

  this.workDiv.classList.add("imageEditor9_hidden");
  this.setMenus(this.workDiv);
  
  this.workDiv.addEventListener("fullscreenchange", this.fullscreenchange.closureListener(this));
  this.workDiv.addEventListener("mozfullscreenchange", this.fullscreenchange.closureListener(this));
  this.workDiv.addEventListener("webkitfullscreenchange", this.fullscreenchange.closureListener(this));
  
  // dialog
  var dialogDiv = document.createElement('DIV');
  dialogDiv.classList.add("imageEditor9_hidden");
  dialogDiv.classList.add("imageEditor9_dialog");
  document.body.appendChild(dialogDiv);

  var backDiv = document.createElement('DIV');
  backDiv.classList.add("imageEditor9_background");
  dialogDiv.appendChild(backDiv);

  this.dialogDiv = dialogDiv;
}

ImageEditor9.prototype.setMenus = function(parent){
    function makeElement(parent, menuStyles, imgStyles) {
        var menuBtn = document.createElement("A")
        menuStyles.forEach(function(item){ 
            menuBtn.classList.add(item);
        })
        parent.appendChild(menuBtn);
    
        var menuImg = document.createElement("DIV")
        menuBtn.appendChild(menuImg);    
        imgStyles.forEach(function(item){ 
            menuImg.classList.add(item);
        })
        
        return menuBtn;
    }
    // 메인 메뉴
    var mainMenu = makeElement(parent, ["floatingButton"], ["floatingButtonImg", "mainMenuImg"]);
    util9.addEvent(mainMenu, "click", this.imageEditor9_toggle_menu.closureListener(this));

    // 하위 메뉴
    this.subMenu = document.createElement("UL")
    parent.appendChild(this.subMenu);
    
    var _this = this;
    var subMenuImages = ['-155px', '-133px', '-111px', '-89px', '-67px', '-23px', '0px'];
    subMenuImages.forEach(function(item, index){ 
        var li = document.createElement("LI")
        _this.subMenu.appendChild(li);
        var subMenuItem = makeElement(li, [], ["floatingButtonImg"]);
        subMenuItem.firstChild.style.backgroundPosition = item + " 0px";
        subMenuItem.id = index;
        subMenuItem.firstChild.id = index;
        util9.addEvent(subMenuItem, "click", _this.subMenuClick.closureListener(_this));
    });
}

ImageEditor9.prototype.subMenuClick = function(event){
    switch (event.target.id) {
        case '0': this.rotate_resize(); break;
        case '1': this.setRotate(10);   break;
        case '2': this.setRotate(-10);  break;
        case '3': this.zoomin(-0.1);    break;
        case '4': this.zoomin(0.1);     break;
        case '5': this.close();         break;
        case '6': this.save();  
    }
}

ImageEditor9.prototype.imageEditor9_toggle_menu = function(event){
  if (this.subMenu.classList.contains( "imageEditor9_toggle_menu" ) ) {
     this.subMenu.classList.remove( "imageEditor9_toggle_menu" );
     return;
  }
  this.subMenu.classList.add( "imageEditor9_toggle_menu" );

  this.subMenu.classList.remove("vertical");
  this.subMenu.classList.remove("horizon");

  var classname = "";
  if (this.isFullscreen) {
    classname = window.screen.availWidth > window.screen.availHeight ? "vertical" : "horizon";
  } else {
    classname = util9.getStyleI(this.workDiv, "width") > util9.getStyleI(this.workDiv, "height") ? "vertical" : "horizon";
  }
  this.subMenu.classList.add(classname);
}

ImageEditor9.prototype.mousedown4canvas = function(event){
  if (!this.imgInfo.width || this.actionType) return;

  this.sx = event.pageX;
  this.sy = event.pageY;
  var pX = (this.sx - event.target.offsetLeft) / this.canvasZoom;
  var pY = (this.sy - event.target.offsetTop)  / this.canvasZoom;

  var oldNode = this.activeNode;
  this.activeNode = this.getElementAtPos(pX, pY);   
  if (this.activeNode==null) {
    if (this.checkMenu(pX, pY, oldNode)) return;
    
    this.activeNode = this.imgInfo; // 선택된 것이 없고, 선택  가능으로 설정된 경우 사용자 사진을 선택되게 함.
    if (this.checkMenu4Back(pX, pY)) return;
  }
  if (this.activeNode.lock) {
    this.draw();  
    return;
  }
  this.actionType = NODE_MOVE;

  this.draw();  
}

ImageEditor9.prototype.mousemove4canvas = function(event){
  if (!this.actionType) return;

  this.activeNode.left += (event.pageX - this.sx);
  this.activeNode.top  += (event.pageY - this.sy);

  this.draw();
  this.sx = event.pageX;
  this.sy = event.pageY;
}

ImageEditor9.prototype.setImageSource = function(img){ 
  this.angle = 0;
  this.userPhoto = img;
  this.imgInfo = util9.clone(ImageEditor9_initInfo);
  this.activeNode = this.imgInfo;
  
  this.cloneImage(img, img.naturalWidth, img.naturalHeight);
  this.setImageInfo();
}

ImageEditor9.prototype.cloneImage = function(img, w, h){ 
  this.imgInfo.width  = w;
  this.imgInfo.height = h;

  if (!this.imgInfo.img) this.imgInfo.img = document.createElement('canvas');
  this.imgInfo.img.width  = w;
  this.imgInfo.img.height = h;

  var ctx = this.imgInfo.img.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w/2, h/2);  
  ctx.rotate(this.angle * Math.PI / 180);
  if (this.angle === 0 || this.angle === 180) 
       ctx.drawImage(img, -(w/2), -(h/2), w, h);  
  else ctx.drawImage(img, -(h/2), -(w/2), h, w);  
  ctx.restore()  
}

ImageEditor9.prototype.setImageInfo = function(isNoZoom){ 
  var w = h = 0;
  if (this.isFullscreen) {
    w = window.screen.availWidth;
    h = window.screen.availHeight;
  } else {
    w = util9.getStyleI(this.workDiv, "width");
    h = util9.getStyleI(this.workDiv, "height");
  }
  
  if (isNoZoom || (this.imgInfo.width<w-10 && this.imgInfo.height < h-10)) {
    this.canvasZoom = 1;
  } else {
    var rate_h = h / this.imgInfo.height;
    var rate_w = w / this.imgInfo.width;
    this.canvasZoom = rate_w > rate_h ? rate_h : rate_w;
  }
  
  this.imgInfo.width  = this.imgInfo.width * this.canvasZoom;
  this.imgInfo.height = this.imgInfo.height* this.canvasZoom;
  this.workCanvas.width  = this.imgInfo.width;
  this.workCanvas.height = this.imgInfo.height;
  this.backCanvas.width  = this.workCanvas.width;
  this.backCanvas.height = this.workCanvas.height;

  this.imgInfo.left = 0;
  this.imgInfo.top  = 0;
  this.workCanvas.style.left = ((w - this.workCanvas.width)   / 2  -1) + "px";    // to center
  this.workCanvas.style.top  = ((h - this.workCanvas.height)  / 2  -1) + "px";

  this.draw();
  /*
  if ( (w>h & this.workCanvas.width < this.workCanvas.height) || (w<h & this.workCanvas.width > this.workCanvas.height) ) {
    this.showMessage ("The image proportions are not suitable for editing.</br>Automatically rotate the image.");
  }*/
}

ImageEditor9.prototype.rotate_resize = function(){ 
  this.angle += 90;
  if (this.angle >= 360) this.angle = 0;
  
  this.cloneImage(this.userPhoto, this.imgInfo.img.height, this.imgInfo.img.width);

  this.setImageInfo();
}

ImageEditor9.prototype.checkMenu = function(pX, pY, oldNode){ 
  if (!oldNode) return false;

  if (util9.isInRectMenu(pX, pY, oldNode, 20)){
    this.actionType = MENU_REMOVE;
    this.activeNode = oldNode;
    return true;
  }
  if (util9.isInRectMenu(pX, pY, oldNode, 60)){
    this.actionType = oldNode.type===TYPE_IMAGE ? MENU_LOCK : MENU_COLOR; // Text는 메뉴가 4개, 이미지는 2개라
    this.activeNode = oldNode;
    return true;
  }
  if (util9.isInRectMenu(pX, pY, oldNode, 100)){
    this.actionType = MENU_EDIT;
    this.activeNode = oldNode;
    return true;
  }
  if (util9.isInRectMenu(pX, pY, oldNode, 140)){
    this.actionType = MENU_LOCK;
    this.activeNode = oldNode;
    return true;
  }

  return false;
}

ImageEditor9.prototype.checkMenu4Back = function(pX, pY){ 
  var isIn = pX>15 && pX<45 &&
             pY>this.backCanvas.height-45 && pY<this.backCanvas.height-15;

  if (isIn){
    this.actionType = MENU_LOCK;
    return true;
  }

  return false;
}

ImageEditor9.prototype.removeElement = function(){ 
  if (!confirm("삭제하시겠습니까?")) return;
  var i;
  for (i = 0; i < this.elementList.length; i++) {
    if (this.elementList[i]===this.activeNode) {
      this.elementList.splice(i, 1);
      this.activeNode = this.imgInfo;
      this.draw();
      return;
    }
  } 
}

ImageEditor9.prototype.setTextColor = function(color){ 
  if (!this.activeNode) return;
  this.activeNode.color = color;
  this.draw();
}

ImageEditor9.prototype.changeTextColor = function(){ 
  ev_showColorDialog(this.activeNode.color);
}

ImageEditor9.prototype.changeText = function(){ 
  var text = util9.inputText(this.activeNode.text);
  if (!text) return;        // esc
  this.activeNode.text = text;

  this.backCtx.font =  "bold " + this.activeNode.fontSize + "px SangSangFlowerRoad";
  var w = this.backCtx.measureText(text).width;

  this.activeNode.width = w;
  this.activeNode.text = text;
  this.draw();
}

ImageEditor9.prototype.changeLock = function(){ 
  this.activeNode.lock = ! this.activeNode.lock;
  this.draw();
}

ImageEditor9.prototype.getElementAtPos = function(posX, PosY){
  var i=this.elementList.length-1;
  for (; i >-1; i--) {
    if (util9.isInRect(posX, PosY, this.elementList[i]) ) 
      return this.elementList[i];
  } 
  return null;
}

ImageEditor9.prototype.setMaskImage = function(img){ 
    this.backImg = img;
    this.draw();        
}

var firstSize, originalInfo = null;

ImageEditor9.prototype.touchstart = function(event){
  event.preventDefault();
  if (!this.imgInfo.width) return;

  var touches = event.touches; 
  this.sx = touches[0].pageX;
  this.sy = touches[0].pageY;
  
  if (touches.length>1) {         
    this.actionType = NODE_READY;
    this.sx2 = touches[1].pageX;
    this.sy2 = touches[1].pageY;
	
    //firstSize = touches[0].pageX - touches[1].pageX;
    originalInfo = Object.assign({}, this.activeNode);
    //changedAngle = util9.getAngle(this.sx, this.sy, touches[1].pageX, touches[1].pageY);
    return;
  }    

  var pX = (this.sx - event.target.offsetLeft) / this.canvasZoom;
  var pY = (this.sy - event.target.offsetTop) / this.canvasZoom;

  var oldNode = this.activeNode;
  this.activeNode = this.getElementAtPos(pX, pY); 
  if (this.activeNode==null) {
    if (this.checkMenu(pX, pY, oldNode)) return;

    this.activeNode = this.imgInfo; // default select

    if (this.checkMenu4Back(pX, pY)) return;
  }
  if (this.activeNode.lock) {
    this.draw();  
    return;
  }

  this.actionType = NODE_MOVE;

  this.draw();
}

var changedAngle=null;

ImageEditor9.prototype.touchmove = function(event){
  event.preventDefault();
  if (!this.actionType) return;

  var touches = event.touches;
  var pageX = touches[0].pageX,
      pageY = touches[0].pageY;

  if (this.actionType === NODE_READY) { 
	 var slope = Math.max(util9.getSlope(this.sx,  this.sy,  touches[0].pageX, touches[0].pageY), 
						  util9.getSlope(this.sx2, this.sy2, touches[1].pageX, touches[1].pageY));
	 if (slope === -1) return;
	 this.actionType = slope > imageEditor9_base_slope ? NODE_RESIZE : NODE_ROTATE;
	 this.sx = touches[0].pageX;
	 this.sy = touches[0].pageY;
     firstSize = touches[0].pageX - touches[1].pageX;
     changedAngle = util9.getAngle(this.sx, this.sy, touches[1].pageX, touches[1].pageY);
  } else
  if (this.actionType === NODE_RESIZE) { 
      var rate =  (touches[0].pageX-touches[1].pageX) / firstSize;
      if (rate<0.3) {rate = 0.3; return;}
      if (this.activeNode.type===TYPE_TEXT) {
        this.activeNode.fontSize = originalInfo.fontSize * rate;
        this.backCtx.font =  "bold " + this.activeNode.fontSize + "px SangSangFlowerRoad";
        var w = this.backCtx.measureText(this.activeNode.text).width;
        this.activeNode.width  = w;
        this.activeNode.height = this.activeNode.fontSize;
        this.activeNode.top   = originalInfo.top - (this.activeNode.height - originalInfo.height) / 2;
        this.activeNode.left  = originalInfo.left - (this.activeNode.width  - originalInfo.width) / 2;        
      } else {
        this.activeNode.width = originalInfo.width * rate;
        this.activeNode.height= originalInfo.height * rate;
        this.activeNode.top  = originalInfo.top + (originalInfo.height- originalInfo.height* rate) / 2;
        this.activeNode.left = originalInfo.left+ (originalInfo.width - originalInfo.width * rate) / 2;        
      }
  } else
    if (this.actionType === NODE_ROTATE) { 
      this.activeNode.angle += (util9.getAngle(this.sx, this.sy, touches[1].pageX, touches[1].pageY) - changedAngle);
      changedAngle = util9.getAngle(this.sx, this.sy, touches[1].pageX, touches[1].pageY);
  } else
    if (this.actionType === NODE_MOVE) {
      this.activeNode.left += (pageX - this.sx);
      this.activeNode.top  += (pageY - this.sy);      
    }
  
    this.draw();
    this.sx = pageX;
    this.sy = pageY;
};

ImageEditor9.prototype.stopMoving = function(event){
  event.preventDefault();
  switch (this.actionType) {
    case MENU_REMOVE: this.removeElement(); break;
    case MENU_COLOR:  this.changeTextColor(); break;
    case MENU_EDIT:   this.changeText(); break;
    case MENU_LOCK:   this.changeLock(); break;
  }

  this.actionType = null;
  changedAngle  = null;
}

/** ---------------------------------------------------------------------------------
 * draw
 */  
ImageEditor9.prototype.draw = function(){
    this.workCtx.clearRect(0, 0, this.workCanvas.width, this.workCanvas.height);
    if (!this.userPhoto) {
      if (this.backImg) this.workCtx.drawImage(this.backImg, 0, 0, this.workCanvas.width, this.workCanvas.height);
      return;
    }
    
    var centerX = this.imgInfo.left   + this.imgInfo.width /2, 
        centerY = this.imgInfo.top    + this.imgInfo.height/2,
        sizeX   = this.imgInfo.width  * this.imgInfo.zoom,
        sizeY   = this.imgInfo.height * this.imgInfo.zoom;

    this.backCtx.clearRect(0, 0, this.backCanvas.width, this.backCanvas.height);
    this.backCtx.save();
    this.backCtx.translate(centerX, centerY);
    this.backCtx.rotate(this.imgInfo.angle);
    this.backCtx.drawImage(this.imgInfo.img, -sizeX/2, -sizeY/2, sizeX, sizeY);
    this.backCtx.rotate(-this.imgInfo.angle);
    this.backCtx.translate(-centerX, -centerY);
    //this.backCtx.restore();
    if (this.backImg) this.backCtx.drawImage(this.backImg, 0, 0, this.backCanvas.width, this.backCanvas.height);

    var _this = this;
    this.elementList.forEach(function(node){
      _this.drawNode(node, "black");
    });
    
    /*if (this.activeNode===this.imgInfo) {     // 사용자 사진이면
      this.drawUserImageMenu(this.activeNode);
    } else */
    if (this.activeNode && this.activeNode!==this.imgInfo) {
      this.drawNode(this.activeNode, "red");
    }
    this.backCtx.restore();

    
    this.workCtx.drawImage(this.backCanvas, 0, 0, this.workCanvas.width, this.workCanvas.height);
}

ImageEditor9.prototype.drawNode = function(node, color){
  var x = node.left+node.width/2,
      y = node.top + node.height/2;

  this.backCtx.translate(x, y);
  this.backCtx.rotate(node.angle);

  if (node.type===TYPE_IMAGE) {
    this.backCtx.drawImage(node.img, -node.width/2, -node.height/2, node.width, node.height);
  } else {
    this.backCtx.font =  "bold " + node.fontSize + "px SangSangFlowerRoad";
    this.backCtx.textAlign = "center";
    this.backCtx.fillStyle = node.color;
    this.backCtx.fillText(node.text, 0, node.height/2-node.height/10);//-node.width/2, node.height/2-7); 
  }

  // toolbars --------------------
  if (node===this.activeNode) {
    this.backCtx.lineWidth = 3;
    this.backCtx.fillStyle = "black";
    this.backCtx.font =  "bold 30px sans-serif";
    this.backCtx.textAlign = "center";
    // 삭제 버튼
    this.backCtx.beginPath();    
    this.backCtx.arc(-node.width/2, -node.height/2-20, 20, 0, 2 * Math.PI);
    this.backCtx.stroke(); 
    this.backCtx.fillText("X", -node.width/2, -node.height/2-10);

    if (node.type===TYPE_TEXT) {
      // 색상 버튼
      this.backCtx.beginPath();    
      this.backCtx.arc(-node.width/2+40, -node.height/2-20, 20, 0, 2 * Math.PI);
      this.backCtx.stroke(); 
      this.backCtx.fillText("C", -node.width/2+40, -node.height/2-10);
      // 수정 버튼
      this.backCtx.beginPath();    
      this.backCtx.arc(-node.width/2+80, -node.height/2-20, 20, 0, 2 * Math.PI);
      this.backCtx.stroke(); 
      this.backCtx.fillText("E", -node.width/2+80, -node.height/2-10);    
      /* Lock*/
      this.backCtx.beginPath();    
      this.backCtx.arc(-node.width/2+120, -node.height/2-20, 20, 0, 2 * Math.PI);
      this.backCtx.stroke(); 
      if (node.lock)
           this.backCtx.drawImage(this.lockImg,   -node.width/2+105, -node.height/2-35, 30, 30);
      else this.backCtx.drawImage(this.unlockImg, -node.width/2+105, -node.height/2-35, 30, 30);
    } else
    if (node.type===TYPE_IMAGE) {
      /* Lock*/
      this.backCtx.beginPath();    
      this.backCtx.arc(-node.width/2+40, -node.height/2-20, 20, 0, 2 * Math.PI);
      this.backCtx.stroke(); 
      if (node.lock)
           this.backCtx.drawImage(this.lockImg,   -node.width/2+25, -node.height/2-35, 30, 30);
      else this.backCtx.drawImage(this.unlockImg, -node.width/2+25, -node.height/2-35, 30, 30);
    }
  }

  this.backCtx.rotate(-node.angle);
  this.backCtx.translate(-x, -y);
}

ImageEditor9.prototype.drawUserImageMenu = function(node, color){
  this.backCtx.lineWidth = 3;
  this.backCtx.fillStyle = "black";

  if (node.lock)
       this.backCtx.drawImage(this.lockImg, 15, this.backCanvas.height-45, 30, 30);
  else this.backCtx.drawImage(this.unlockImg, 15, this.backCanvas.height-45, 30, 30);
  this.backCtx.beginPath();    
  this.backCtx.arc(30, this.backCanvas.height-30, 20, 0, 2 * Math.PI);
  this.backCtx.stroke(); 
}
  
/** ---------------------------------------------------------------------------------
 * diverse feature
 */  
 
ImageEditor9.prototype.zoomin = function(zoom){ 
  if (!this.activeNode || this.activeNode.width + this.activeNode.width*zoom<80) {return;}


  this.activeNode.zoom += zoom;
  if (this.activeNode.type === TYPE_TEXT) {
    var old_w = this.activeNode.width;
    var old_h = this.activeNode.height;
    this.activeNode.fontSize += this.activeNode.fontSize * zoom;
    this.backCtx.font =  "bold " + this.activeNode.fontSize + "px SangSangFlowerRoad";

    this.activeNode.width  = this.backCtx.measureText(this.activeNode.text).width;
    this.activeNode.height = this.activeNode.fontSize;
    this.activeNode.top   -= (this.activeNode.height - old_h) / 2;
    this.activeNode.left  -= (this.activeNode.width  - old_w) / 2;
  }

  this.draw();
}

ImageEditor9.prototype.setRotate = function(value){ 
  if (!this.activeNode) {return;}
  
  this.activeNode.angle += value*Math.PI/180
  this.draw();
}

ImageEditor9.prototype.getImage = function(){ 
  this.activeNode = null;
  this.draw();

  dataURL = this.backCanvas.toDataURL();
  return dataURL.replace("data:image/png;base64,", "");
}

ImageEditor9.prototype.toDataURL = function(){ 
  this.imgInfo.width  = this.imgInfo.img.width;
  this.imgInfo.height = this.imgInfo.img.height;

  this.setImageInfo(true);

  return this.workCanvas.toDataURL();
}


ImageEditor9.prototype.addImageNode = function(url){ 
  var newNode = {
    type: TYPE_IMAGE,
    width: 100,
    height: 100,
    angle: 0,
    zoom:1,
    lock: false
  };
  newNode.top = (this.workCanvas.height-newNode.height) / 2 + this.elementList.length*10;
  newNode.left = (this.backCanvas.width-newNode.width) / 2 *this.canvasZoom + this.elementList.length*10;
  var _this = this;
  var imgK = document.createElement('IMG');
  $(imgK).load(function() {
    newNode.img = imgK;
    newNode.height = imgK.height * 100/imgK.width;
    _this.draw();
  });
  $(imgK).attr('src', url);//"/images/user.jpg"); 
  this.elementList.push(newNode);
  this.activeNode = newNode;
}

ImageEditor9.prototype.addTextNode = function(text){ 
  if (!text) {
    var text = util9.inputText(text);
    if (!text) return;        // esc
  }

  var newNode = {
    type: TYPE_TEXT,
    height: FONTSIZE,
    fontSize: FONTSIZE,
    angle: 0,
    zoom:1,
    color: "#ffff00",
    text: text,
    lock: false
  };
  this.backCtx.font =  "bold " + newNode.fontSize + "px SangSangFlowerRoad";
  newNode.width = this.backCtx.measureText(text).width;
  newNode.top = (this.workCanvas.height-FONTSIZE) / 2 + this.elementList.length*10;
  newNode.left = (this.backCanvas.width-newNode.width) / 2 *this.canvasZoom + this.elementList.length*10;

  this.elementList.push(newNode);
  this.activeNode = newNode;
  this.draw();
}

ImageEditor9.prototype.show = function(){ 
  this.workDiv.classList.remove("imageEditor9_hidden");
}

ImageEditor9.prototype.showFullscreen = function(){
  this.show();
  var elem = this.workDiv;      
  var rfs = elem.mozRequestFullScreen || elem.mozRequestFullScreen || elem.webkitRequestFullScreen || elem.msRequestFullscreen;
  if (!rfs) {
      this.showFulldocument();
      return;
  }
  rfs.call(elem);
  this.isFullscreen = true;
}

ImageEditor9.prototype.fullscreenchange = function(){
  if (this.isFullscreen && !document.fullscreenElement) {
    this.close();
  }  
}

ImageEditor9.prototype.showFulldocument = function(){
  this.workParent = this.workDiv.parentElement;
  this.workWidth  = this.workDiv.style.width; // save info
  this.workHeight = this.workDiv.style.height;
  
  var w = document.documentElement.clientWidth,
      h = document.documentElement.clientHeight;
    
  this.workDiv.style.width  = w + "px";
  this.workDiv.style.height = h + "px";

  this.dialogDiv.appendChild(this.workDiv);
  this.dialogDiv.classList.remove("imageEditor9_hidden");
  
  this.show();
}

ImageEditor9.prototype.close = function(){ 
  if (this.workParent) {
    this.workParent.appendChild(this.workDiv);  
    this.workParent = null;
    this.workDiv.style.width  = this.workWidth;
    this.workDiv.style.height = this.workHeight;
  }else
  if (this.isFullscreen && document.exitFullscreen) {
    document.exitFullscreen(); 
    this.isFullscreen = false;
  }
  this.workDiv.classList.add("imageEditor9_hidden");
  this.dialogDiv.classList.add("imageEditor9_hidden");
}

ImageEditor9.prototype.save = function(){ 
    if (this.onSave) this.onSave();
    this.close();
}

ImageEditor9.prototype.showMessage = function(msg){ 
  if (!msg) return;

  if (!this.snackbar) {
      var div = document.createElement('div');
      document.documentElement.appendChild(div);  
      div.classList.add("imageEditor9_snackbar");
      this.snackbar = div;
  }
  this.snackbar.innerHTML = msg;
  this.snackbar.classList.add("imageEditor9_snackbar_show");
  var _this = this;
  setTimeout(function(){ _this.snackbar.classList.remove("imageEditor9_snackbar_show"); }, 3000);
}

