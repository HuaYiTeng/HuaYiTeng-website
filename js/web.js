//导航按钮（移动端统一逻辑已迁移至 nav.js，此处仅保留 PC 端滚动和 Swiper 功能）

// 返回顶部
$(window).scroll(function () {
    if ($(window).scrollTop() >= 300) {
        $(".page-down").fadeIn();
    } else {
        $(".page-down").fadeOut();
    }
});
(function Page() {
    var oDown = $(".page-down"),
        oBody = $("html,body");
    oDown.bind("click", function () {
        oBody.animate({ scrollTop: 0 }, 500);
    });
})();

function Kongzhi() {
    $(".banner .swiper-wrapper").css("height", $(".banner .swiper-wrapper img").height() * 1 + "px");
}

// 内页滚动时给导航添加阴影效果
$(window).scroll(function () {
    if ($(window).scrollTop() >= 50) {
        $(".nyheader").addClass("on");
        $(".nysearch").addClass("on");
    } else {
        $(".nyheader").removeClass("on");
        $(".nysearch").removeClass("on");
    }
});

// 初始化 Swiper 轮播
var mySwiper = new Swiper('.banner', {
    pagination: '.pagination',
    loop: true,
    grabCursor: true,
    paginationClickable: true
});

var mySwiper2 = new Swiper('.showmendianpic', {
    pagination: '.pagination',
    loop: true,
    grabCursor: true,
    paginationClickable: true
});

// 轮播图自适应高度
$(window).on('load resize', function() {
    var $banner = $('.banner');
    var winWidth = $(window).width();
    var targetHeight;
    if (winWidth <= 640) {
        targetHeight = 250;
    } else if (winWidth <= 1024) {
        targetHeight = 350;
    } else {
        targetHeight = 500;
    }
    $banner.css('height', targetHeight + 'px');
    $banner.find('.swiper-wrapper, .swiper-slide').css('height', '100%');
});

setTimeout(function() {
    if (typeof mySwiper !== 'undefined' && mySwiper !== null) {
        if (mySwiper && typeof mySwiper.reInit === 'function') {
            mySwiper.reInit();
        }
    }
}, 100);