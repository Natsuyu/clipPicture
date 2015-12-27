function clipPic(target,chow,choh){

var canvas,  //底层画布，用于绘制图像
	cut,     //保存截图按钮
	url,     //图片的src
	cover,   //遮罩层
	floor,   //浮层画布，用于绘制选框效果
	set;     //『头像设置』div
var file, refile, rotate;
var view_big,//预览 100 * 100 画布
	view_mid,//预览 50 *50  画布
	view_small;//预览 25 * 25 画布
var scalex, scaley; //图片的缩放比例
var chosW = 0,chosH = 0, r = 0; //选框大小（宽，高，半径）
var initimage,image, ctx,ctx2, bigctx, midctx, smallctx;
//原始image对象， 缩放后的image对象， 底层画布的context, 浮层画布的context, 大预览的context, 中预览的context， 小预览的context
var canW = 360, canH = 360,canL, canT; //画布宽，高；画布的x，y坐标
var draw = null;    //执行绘画对象

var mx,my; //鼠标的x，y坐标
var disx, disy; //移动选框的辅助变量
var rx,ry,rw,rh;//选框的坐标，选框的尺寸
var dragx,dragy,dragw,dragh; //拖动点的坐标， 尺寸
var canmove = 0,candrag = 0;//当前是否可拖动， 是否可缩放
var l,t,ll,tt;

var fiveM = 1024*1024*5;   //5M
var num;

canvas = getid("canvas");
cover = getid("cover");
floor = getid("coverfloor");
set = getid("set");
view_big = getid("big");
view_mid = getid("mid");
view_small = getid("small");
file = getid("file");
refile = getid("refile");
rotate = getid("rotate");

canvas.width = canW;
canvas.height = canH;
floor.width = canW;
floor.height = canH;

cover.style.cssText = "width:"+window.innerWidth+"px; height:"+window.innerHeight+"px; 	display:block;";
cut = getid("cut");

refile.onchange = function(){getPic(refile);};
file.onchange = function(){getPic(file);};
cut.onclick = function(){draw.output();};
rotate.onclick = rotateDeg;
getid("close").onclick = close;
getid("cancel").onclick = close;

function getPic(File){
	
	image = new Image();
	initimage = new Image();

	if(window.FileReader)
	{
		var f = new FileReader();
		f.onload = function(e){
			if(!/image\/\w+/.test(File.files[0].type)){  
			    alert("请确保文件为图像类型");  
			    return false;  
			}
			if(File.files[0].size > fiveM)
			{
				alert("请确保图片大小小于5M");
				return;
			}

			url = this.result;
			image.src = url;

			initimage.src=url;

			image.onload = function()
			{
				if(image.width<100||image.height<100)
				{
					alert("请确保图片规格大于100*100");
					return;
				}
				initimage.onload = init;
			}
		};
		f.readAsDataURL(File.files[0]);
	}
	else{
		console.log("Not Support");
	}
}

function close(){     //关闭set框
	cover.style.cssText = "display:none;";
	removeEvent("mousedown",mouseDown);
	removeEvent("mouseup",mouseUp);
	removeEvent("mousemove",mouseMove);
}
function init(){ 
	num=0;
	addEvent("mousedown",mouseDown);
	addEvent("mouseup",mouseUp);
	addEvent("mousemove",mouseMove);

	canvas.style.cssText = "z-index:1100;";
	floor.style.cssText = "z-index:1101;";

	getScale();
	console.log(image.width,image.height);
	l=ll=(canW-image.width)/2,t=tt=(canH-image.height)/2;

	ctx = canvas.getContext("2d");
	ctx2 = floor.getContext("2d");
	bigctx = view_big.getContext("2d");
	midctx = view_mid.getContext("2d");
	smallctx = view_small.getContext("2d");
	
	ctx.clearRect(0,0,canW,canW);
	ctx2.clearRect(0,0,canW,canW);

	getChooseArea(chow,choh);
	if(draw==null) draw = new drawObj();
	
	canL = canvas.offsetLeft + canvas.offsetParent.offsetLeft + set.offsetLeft ;
	canT = canvas.offsetTop + canvas.offsetParent.offsetTop + set.offsetTop ;	
	draw.init();
	draw.drawBack(); 
	draw.drawRect();
	draw.preview.draw();
}
function rotateDeg(){
	num=(num+1)%4;
	var tmp=((num%2==0)?1:0);
	ll=tmp?l:t,tt=tmp?t:l;
	
	ctx.save();
	ctx.clearRect(0,0,canW,canH);
	ctx.translate(canW/2,canH/2);
	ctx.rotate(-Math.PI/2*num);
	ctx.translate(-canW/2,-canH/2);
	ctx.fillStyle = "#000";
	ctx.fillRect(0,0,canW, canH);
	ctx.drawImage(image,l,t,image.width,image.height);
	ctx.restore();

	draw.drawBack(); 
	draw.drawRect();
	draw.preview.draw(draw.rect.x,draw.rect.y);
}
function getScale()  //计算缩放比例
{
	var h=0,w=0;
	if(image.width>image.height)
	{
		w=canW;
		h=canW*image.height*1.0/image.width;
		scalex=scaley=initimage.width/canvas.width;image.width=w;image.height=h;
	}
	else 
	{
		h=canH;
		scalex=scaley=w=canH*image.width*1.0/image.height;
		scalex=scaley=initimage.height/canvas.height;image.width=w;image.height=h;
	}
}
function getChooseArea(w,h){ //判定是矩形还是圆形
	if(w&&h)
		{chosW = w; chosH = h;}
	else 
		{r = w;}
}

function canDrag()   //判断鼠标是否在缩放点区域
{
	if(mx>=dragx&&mx<=dragx+dragw&&my>=dragy&&my<=dragy+dragh) return 1;
	return 0;
}
function canMove()  //判断鼠标是否在选框区
{
	if(choh>0)
		{if(mx>=rx&&mx<=rx+rw&&my>=ry&&my<=ry+rh) return 1;}
	else 
		if(Math.pow((mx-rx-rw/2),2)+Math.pow((my-ry-rh/2),2)<=Math.pow(rw/2,2)) return 1;
	else 
		return 0;
}
function mouseDown(e){
	mx = (e.clientX || e.pageX)+document.body.scrollLeft;
	my = (e.clientY || e.pageY)+document.body.scrollTop;

	candrag = canDrag();
	if(candrag == 1) canmove = 0;
	else canmove = canMove();

	disx = mx-rx;
	disy = my-ry;
}
function mouseUp(e){
	canmove = 0;
	candrag = 0;
}
function mouseMove(e){
	mx = (e.clientX || e.pageX)+document.body.scrollLeft;
	my = (e.clientY || e.pageY)+document.body.scrollTop;
	
	if(canDrag()) floor.style.cursor = "nw-resize";
	else if(canMove()) floor.style.cursor = "move";
	else floor.style.cursor = "auto";

	if(candrag ==1)
		{floor.style.cursor = "nw-resize";draw.drag();}
	else if(canmove == 1)
		{floor.style.cursor = "move";draw.move();}
}


var drawObj = function(){              
	this.rect = new rectObj();
	this.preview = new previewObj();
}
drawObj.prototype.init = function(){   //绘制底层图片
	this.rect.init();
	ctx.fillStyle = "#000";
	ctx.fillRect(0,0,canW, canH);
	ctx.drawImage(image,l, t,image.width,image.height);
	this.preview.draw(this.rect.x,this.rect.y);
}
drawObj.prototype.drawBack = function(){  //浮层效果
	ctx2.clearRect(0,0,canW,canH);
	ctx2.fillStyle = "rgba(255,255,255,0.5)";
	var tmp=((num%2==0)?1:0);
	// console.log(tmp?t:l,tmp?l:t,tmp?image.width:image.height,tmp?image.height:image.width);
	ctx2.fillRect(tmp?l:t,tmp?t:l,tmp?image.width:image.height,tmp?image.height:image.width);//use the function "rect",then need to use the "stroke" function
}

drawObj.prototype.drawRect = function(){  //绘制选框
	this.rect.draw();
}
drawObj.prototype.move = function(){  //拖动
	this.drawBack();
	this.rect.move();
	this.preview.draw(this.rect.x,this.rect.y);
}
drawObj.prototype.drag = function(){  //缩放
	this.drawBack();
	this.rect.expand();
	this.preview.draw(this.rect.x,this.rect.y);
}
drawObj.prototype.output = function(){    //输出截图
	target.src = view_big.toDataURL("image/png");
	close();
}
var dragObj = function(){    //缩放点对象
	this.x;
	this.y;
	this.r;
}
dragObj.prototype.init = function(father){
	this.r=5;
	this.x = father.x + Math.ceil(father.width*0.5*(1+Math.sqrt(2)*0.5))-this.r;
	this.y = father.y + Math.ceil(father.height*0.5*(1+Math.sqrt(2)*0.5))-this.r;

	dragx=this.x+canL;dragy=canT+this.y;dragw=dragh=this.r*2;
}
dragObj.prototype.draw = function(father){
	ctx2.save();
	ctx2.fillStyle = "#fff";
	ctx2.strokeStyle = "#000";
	ctx2.beginPath();
	ctx2.arc(this.x + this.r,this.y+this.r,this.r,0,Math.PI*2,false);
	ctx2.stroke();
	ctx2.clip();
	ctx2.fillRect(0,0,canW,canH);
	ctx2.restore();
}
dragObj.prototype.move = function(father)
{
	this.init(father);
	this.draw(father);
}
var rectObj = function(){           //选框对象
	this.x;
	this.y;
	this.width;
	this.height;
	this.type;
	this.drag;
}
rectObj.prototype.init = function(){
	this.type = chosW > 0? 1 : 0; // rect --> 1 circle --> 0

	this.width = (this.type == 1? chosW : r*2);
	this.height = (this.type == 1? chosH : r*2);
	this.x = (canW - this.width)/2;
	this.y = (canW - this.height)/2;

	this.drag = new dragObj();
	this.drag.init(this);
	
	rx = this.x + canL; 
	ry = this.y + canT;
	rw = this.width; 
	rh = this.height;
}
rectObj.prototype.draw = function(){
	if(this.type) ctx2.clearRect(this.x,this.y,this.width,this.height);
	else 
	{
		ctx2.save();
		ctx2.beginPath();
		ctx2.arc(this.x + this.width/2,this.y + this.width/2,this.width/2,0,2*Math.PI,false);

		ctx2.clip();   
		ctx2.clearRect(0,0,canW,canH);
		ctx2.restore();
	}
	this.drag.draw();
}
rectObj.prototype.expand= function(){   //缩放动作
	var tw = (mx-rx)*4/(2+Math.sqrt(2));
		th = tw;

	var tx=this.x+tw,
		ty=this.y+th;

	if(tx>(canW - ll) || ty>(canH -tt));
	else 
		if(tw<30 || th<30);
	else 
	{
		this.width=tw;this.height=th;
	}
	rw=this.width;rh=this.height;

	this.drag.move(this);
	this.draw();
}
rectObj.prototype.move = function(){
	var tmpx = mx - disx,
		tmpy = my - disy;

	rx = (tmpx + this.width > canL + canW - ll) ? canL + canW - ll - this.width : (tmpx < canL + ll ? canL+ ll:tmpx);
	ry = (tmpy + this.height > canT + canH -tt) ? canT + canH - tt - this.height : (tmpy < canT+ tt ? canT + tt:tmpy);
	this.x = rx - canL; 
	this.y = ry - canT;

	this.drag.move(this);
	this.draw();
}
var previewObj = function(){       //预览区域显示
	this.type;
}
previewObj.prototype.draw = function(x,y){
	bigctx.save();
	midctx.save();
	smallctx.save();

	bigctx.translate(view_big.width/2,view_big.height/2);
	bigctx.rotate(-num*Math.PI/2);
	bigctx.translate(-view_big.width/2,-view_big.height/2);

	midctx.translate(view_mid.width/2,view_mid.height/2);
	midctx.rotate(-num*Math.PI/2);
	midctx.translate(-view_mid.width/2,-view_mid.height/2);

	smallctx.translate(view_small.width/2,view_small.height/2);
	smallctx.rotate(-num*Math.PI/2);
	smallctx.translate(-view_small.width/2,-view_small.height/2);

	if(num==1)
	{
		var tmp=x;
		x=canH-y-rh;
		y=tmp;
	}
	else if(num==2)
	{
		x=canW-x-rw;
		y=canH-y-rh;
	}
	else if(num==3)
	{
		var tmp=x;
		x=y;
		y=canW-tmp-rw;
	}

	bigctx.drawImage(initimage,(x-l)*scalex,(y-t)*scaley,rw*scalex,rh*scaley,0,0,view_big.width,view_big.height);
	midctx.drawImage(initimage,(x-l)*scalex,(y-t)*scaley,rw*scalex,rh*scaley,0,0,view_mid.width,view_mid.height);
	smallctx.drawImage(initimage,(x-l)*scalex,(y-t)*scaley,rw*scalex,rh*scaley,0,0,view_small.width,view_small.height);

	bigctx.restore();
	midctx.restore();
	smallctx.restore();

	this.type = chosW > 0? 1 : 0;
	if(this.type == 0)
	{
		this.drawCircle(view_big);
		this.drawCircle(view_mid);
		this.drawCircle(view_small);
	}
}
previewObj.prototype.drawCircle = function(cans){
	cans.style.cssText = "border-radius:50%;";
}

function removeEvent(event, callback, tar){
	 var obj = tar?tar:window;
	 if(window.removeEventListener)
	 	obj.removeEventListener(event,callback);
	 else if(window.detachEvent)
	 	obj.detachEvent("on"+event,callback);
	 else obj["on"+event]=null;
}

function getid(id){return document.getElementById(id);}
function addEvent(event, callback,tar)  //绑定事件
{
	var obj = tar?tar:window;
	if(window.addEventListener) 
		obj.addEventListener(event, callback);
	else if(window.attachEvent)
		obj.attachEvent("on"+event, callback);
	else obj["on"+event]=callback;
}
};