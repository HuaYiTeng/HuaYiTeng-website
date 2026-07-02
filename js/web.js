
//导航按钮
if ($(window).width()<=1200) {
$(".header .nav_handle").click(function(){
  $(".header .inmuen").toggleClass("kai");
  $(this).toggleClass("on");
});
}

$(".nyheader .nav_handle").click(function(){
  $(".nyheader .inmuen").slideToggle();
  $(this).toggleClass("on");
});

var mySwiper = new Swiper('.banner',{
	pagination: '.pagination',
	loop:true,
	grabCursor: true,
	paginationClickable: true
});

//返回顶部
$(window).scroll(function () {
if ($(window).scrollTop()>=300) {
$(".page-down").fadeIn();
}else{
$(".page-down").fadeOut();
}
});
(function Page(){
var oDown = $(".page-down"),
oBody = $("html,body");
oDown.bind("click",function(){
oBody.animate({ scrollTop : 0 },500);
});        
})();

function Kongzhi() {
$(".banner .swiper-wrapper").css("height",$(".banner .swiper-wrapper img").height()*1+"px");
//$(".incasenr .li").css("margin-bottom",$(".incasenr").width()/100+"px");
}


$(window).scroll(function () {
if ($(window).scrollTop()>=50) {
$(".nyheader").addClass("on");
$(".nysearch").addClass("on");
}else{
$(".nyheader").removeClass("on");
$(".nysearch").removeClass("on");
}
});

var mySwiper = new Swiper('.showmendianpic',{
	pagination: '.pagination',
	loop:true,
	grabCursor: true,
	paginationClickable: true
});

// 轮播图自适应高度（只执行一次，不会卡顿）
$(window).on('load resize', function() {
    var $banner = $('.banner');
    var winWidth = $(window).width();
    var targetHeight;
    
    // 根据不同屏幕设置不同高度
    if (winWidth <= 640) {
        targetHeight = 250; // 手机端高度
    } else if (winWidth <= 1024) {
        targetHeight = 350; // 平板端高度
    } else {
        targetHeight = 500; // 电脑端高度
    }
    
    $banner.css('height', targetHeight + 'px');
    $banner.find('.swiper-wrapper, .swiper-slide').css('height', '100%');
});

// 初始化 Swiper（确保重新计算）
setTimeout(function() {
    if (typeof mySwiper !== 'undefined' && mySwiper !== null) {
        if (mySwiper && typeof mySwiper.reInit === 'function') {
            mySwiper.reInit();
        }
    }
}, 100);