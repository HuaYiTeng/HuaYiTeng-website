// ============================================================
//  Hua Yi Teng - 网站功能脚本
//  功能：返回顶部、滚动效果、Swiper 轮播初始化
//  最后更新: 2026-07-08
// ============================================================

(function() {
    'use strict';

    // ============================================================
    //  1. 返回顶部按钮
    // ============================================================

    $(window).scroll(function() {
        if ($(window).scrollTop() >= 300) {
            $(".page-down").fadeIn();
        } else {
            $(".page-down").fadeOut();
        }
    });

    (function Page() {
        var oDown = $(".page-down");
        var oBody = $("html,body");
        oDown.on("click", function() {
            oBody.animate({ scrollTop: 0 }, 500);
        });
    })();


    // ============================================================
    //  2. 内页滚动时导航添加阴影效果
    // ============================================================

    $(window).scroll(function() {
        if ($(window).scrollTop() >= 50) {
            $(".nyheader").addClass("on");
            $(".nysearch").addClass("on");
        } else {
            $(".nyheader").removeClass("on");
            $(".nysearch").removeClass("on");
        }
    });


    // ============================================================
    //  3. Swiper 轮播初始化（等待 DOM 和 Swiper 库就绪）
    // ============================================================

    function initSwiper() {
        // 检查 Swiper 是否已加载
        if (typeof Swiper === 'undefined') {
            // 如果 Swiper 还没加载，等待 100ms 后重试
            setTimeout(initSwiper, 100);
            return;
        }

        // ===== Banner 轮播 =====
        var $banner = $('.banner');
        if ($banner.length > 0) {
            // 如果已经有 Swiper 实例，先销毁
            if (window.bannerSwiper) {
                try {
                    if (typeof window.bannerSwiper.destroy === 'function') {
                        window.bannerSwiper.destroy();
                    }
                } catch(e) {}
                window.bannerSwiper = null;
            }

            window.bannerSwiper = new Swiper('.banner', {
                pagination: '.pagination',
                loop: true,
                grabCursor: true,
                paginationClickable: true,
                autoplay: 3000,
                autoplayDisableOnInteraction: true
            });
        }

        // ===== showmendianpic 轮播 =====
        var $showPic = $('.showmendianpic');
        if ($showPic.length > 0) {
            if (window.showPicSwiper) {
                try {
                    if (typeof window.showPicSwiper.destroy === 'function') {
                        window.showPicSwiper.destroy();
                    }
                } catch(e) {}
                window.showPicSwiper = null;
            }

            window.showPicSwiper = new Swiper('.showmendianpic', {
                pagination: '.pagination',
                loop: true,
                grabCursor: true,
                paginationClickable: true
            });
        }
    }


    // ============================================================
    //  4. 轮播图自适应高度
    // ============================================================

    function resizeBanner() {
        var $banner = $('.banner');
        if ($banner.length === 0) return;

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
    }


    // ============================================================
    //  5. 启动所有功能
    // ============================================================

    // 页面加载完成后初始化
    $(document).ready(function() {
        // 初始化 Swiper
        initSwiper();

        // 轮播图自适应高度
        resizeBanner();

        // 窗口变化时重新调整
        $(window).on('resize', function() {
            resizeBanner();
        });
    });

})();