/**
 * ============================================================
 *  Hua Yi Teng - 统一移动端菜单交互 + 语言切换
 *  功能：移动端菜单展开/收起 + 子菜单点击展开 + 语言切换
 *  适配：兼容 file:// 协议和 http:// 协议双模式
 * ============================================================
 */
'use strict';
// 强制缓存清除版本号
var CACHE_BUST = 'v=2.0';
$(function() {

    // ============================================================
    //  1. 移动端菜单交互
    // ============================================================

    var $navHandle = $('.nyheader .nav_handle');
    var $mobileMenu = $('.nyheader .inmuen');
    var $submenuItems = $('.nyheader .inmuen ul li.has-submenu');
    var $body = $('body');
    var isMenuOpen = false;

    if ($navHandle.length === 0 || $mobileMenu.length === 0) {
        return;
    }

    $navHandle.on('click', function(e) {
        e.stopPropagation();
        $(this).toggleClass('on');

        if ($mobileMenu.hasClass('active')) {
            $mobileMenu.slideUp(300, function() {
                $mobileMenu.removeClass('active');
                $body.removeClass('menu-open');
            });
            isMenuOpen = false;
            $submenuItems.removeClass('open');
            $submenuItems.find('.erji').slideUp(200);
        } else {
            $mobileMenu.addClass('active').slideDown(350);
            $body.addClass('menu-open');
            isMenuOpen = true;
        }
    });

    $submenuItems.on('click', function(e) {
        var $target = $(e.target);
        if ($target.is('a') && $target.closest('.has-submenu').length) {
            e.preventDefault();
            var $parent = $target.closest('.has-submenu');
            var $subMenu = $parent.find('.erji');
            var isCurrentlyOpen = $parent.hasClass('open');

            if (isCurrentlyOpen) {
                $parent.removeClass('open');
                $subMenu.slideUp(250);
            } else {
                $parent.addClass('open');
                $subMenu.slideDown(300);
            }
        }
    });

    $('.nyheader .inmuen ul li .erji .li').on('click', function() {
        if ($mobileMenu.is(':visible')) {
            $submenuItems.removeClass('open');
            $submenuItems.find('.erji').slideUp(150);
            setTimeout(function() {
                $navHandle.removeClass('on');
                $mobileMenu.slideUp(300, function() {
                    $mobileMenu.removeClass('active');
                    $body.removeClass('menu-open');
                });
                isMenuOpen = false;
            }, 200);
        }
    });

    $(document).on('click', function(e) {
        if (isMenuOpen && $mobileMenu.is(':visible')) {
            var $target = $(e.target);
            if (!$target.closest('.nyheader .inmuen').length &&
                !$target.closest('.nyheader .nav_handle').length &&
                !$target.closest('.nyheader .searchkai').length) {
                $navHandle.removeClass('on');
                $mobileMenu.slideUp(300, function() {
                    $mobileMenu.removeClass('active');
                    $body.removeClass('menu-open');
                });
                $submenuItems.removeClass('open');
                $submenuItems.find('.erji').slideUp(200);
                isMenuOpen = false;
            }
        }
    });

    var windowWidth = $(window).width();
    $(window).on('resize', function() {
        var newWidth = $(window).width();
        if (newWidth > 900 && windowWidth <= 900) {
            $navHandle.removeClass('on');
            $mobileMenu.removeClass('active').removeAttr('style');
            $body.removeClass('menu-open');
            $submenuItems.removeClass('open');
            $submenuItems.find('.erji').removeAttr('style');
            isMenuOpen = false;
        }
        windowWidth = newWidth;
    });


    // ============================================================
    //  2. 语言切换 - 兼容本地 file:// 和服务器 http:// 双模式
    // ============================================================

    (function() {
        'use strict';

        var CONFIG = {
            languages: {
                en: { code: 'en', label: 'English', flag: 'EN', path: '' },
                zh: { code: 'zh', label: '中文', flag: 'CN', path: '/cn' }
            },
            defaultLang: 'en',
            excludePatterns: [
                /\.(jpg|png|gif|svg|webp|ico|css|js|json|xml|pdf)$/i,
                /\/assets\//,
                /\/fonts\//
            ]
        };

        function getCurrentPath() {
            return window.location.pathname;
        }

        function detectCurrentLang() {
            var path = getCurrentPath();

            if (path.indexOf('/cn/') !== -1) {
                return 'zh';
            }

            if (path === '/cn' || path === '/cn/') {
                return 'zh';
            }

            var segments = path.split('/');
            for (var i = 0; i < segments.length; i++) {
                if (segments[i] === 'cn') {
                    return 'zh';
                }
            }

            return 'en';
        }

        function getCurrentFileName() {
            var path = getCurrentPath();

            if (!path || path === '/' || path === '') {
                return 'index.html';
            }

            if (path.endsWith('/')) {
                return 'index.html';
            }

            var segments = path.split('/');
            var fileName = segments[segments.length - 1];

            if (fileName && fileName.indexOf('\\') !== -1) {
                var cleanSegments = fileName.split('\\');
                return cleanSegments[cleanSegments.length - 1] || 'index.html';
            }

            return fileName || 'index.html';
        }

        function getTargetUrl(targetLang) {
            var currentLang = detectCurrentLang();

            if (currentLang === targetLang) {
                return window.location.href;
            }

            var fileName = getCurrentFileName();

            if (currentLang === 'zh' && targetLang === 'en') {
                return '../' + fileName;
            }

            if (currentLang === 'en' && targetLang === 'zh') {
                return 'cn/' + fileName;
            }

            return window.location.href;
        }

        function isExcluded() {
            var path = getCurrentPath();
            var patterns = CONFIG.excludePatterns;
            for (var i = 0; i < patterns.length; i++) {
                if (patterns[i].test(path)) {
                    return true;
                }
            }
            return false;
        }

        function updateLanguageMenu() {
            var links = document.querySelectorAll('.lang-menu a[data-lang]');
            var currentLang = detectCurrentLang();

            links.forEach(function(link) {
                var langCode = link.getAttribute('data-lang');
                if (langCode) {
                    var targetUrl = getTargetUrl(langCode);
                    link.setAttribute('href', targetUrl);

                    if (langCode === currentLang) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                }
            });

            // 兼容：使用 id 直接更新按钮
            var btnLabel = document.getElementById('langLabel');
            if (btnLabel) {
                var langs = CONFIG.languages;
                var currentLangObj = langs[currentLang];
                if (currentLangObj) {
                    btnLabel.textContent = currentLangObj.label;
                }
            }

            var langInput = document.getElementById('lang');
            if (langInput) {
                langInput.value = currentLang;
            }
        }

        function initLanguageSwitch() {
            var dropdown = document.getElementById('langDropdown');
            var btn = document.getElementById('langBtn');

            if (!dropdown || !btn) {
                return;
            }

            if (isExcluded()) {
                dropdown.style.display = 'none';
                return;
            }

            updateLanguageMenu();

            btn.onclick = null;

            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var isOpen = dropdown.classList.toggle('open');
                this.setAttribute('aria-expanded', isOpen);
            });

            document.addEventListener('click', function(e) {
                if (dropdown.classList.contains('open') && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('open');
                    btn.setAttribute('aria-expanded', 'false');
                }
            });

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && dropdown.classList.contains('open')) {
                    dropdown.classList.remove('open');
                    btn.setAttribute('aria-expanded', 'false');
                    btn.focus();
                }
            });

            var links = dropdown.querySelectorAll('.lang-menu a[data-lang]');
            links.forEach(function(link) {
                link.addEventListener('click', function() {
                    var currentLabel = btn.querySelector('.lang-label');
                    var targetLabel = this.querySelector('.lang-label');
                    if (currentLabel && targetLabel && currentLabel.textContent !== targetLabel.textContent) {
                        btn.classList.add('switching');
                        setTimeout(function() {
                            btn.classList.remove('switching');
                        }, 300);
                    }
                });
            });

            window.SwitchLanguage = function() {
                dropdown.classList.toggle('open');
                var isOpen = dropdown.classList.contains('open');
                btn.setAttribute('aria-expanded', isOpen);
            };

            // 兼容：强制更新按钮文字（防止 ???? 问题）
            setTimeout(function() {
                var btnLabel = document.getElementById('langLabel');
                if (btnLabel) {
                    var currentLang = detectCurrentLang();
                    var langs = CONFIG.languages;
                    var currentLangObj = langs[currentLang];
                    if (currentLangObj) {
                        btnLabel.textContent = currentLangObj.label;
                    }
                }
            }, 100);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initLanguageSwitch);
        } else {
            initLanguageSwitch();
        }

        window.HYT = window.HYT || {};
        window.HYT.lang = {
            getCurrentLang: detectCurrentLang,
            getTargetUrl: getTargetUrl,
            switchTo: function(langCode) {
                var url = getTargetUrl(langCode);
                if (url && url !== window.location.href) {
                    window.location.href = url;
                }
            },
            refresh: updateLanguageMenu
        };

        window.SwitchLanguage = function() {
            var dropdown = document.getElementById('langDropdown');
            if (dropdown) {
                dropdown.classList.toggle('open');
                var btn = document.getElementById('langBtn');
                if (btn) {
                    var isOpen = dropdown.classList.contains('open');
                    btn.setAttribute('aria-expanded', isOpen);
                }
            }
        };

    })();

});
// ============================================================
//  Cookie 同意横幅（GDPR 合规）- 多语言自动切换
// ============================================================

(function() {
    'use strict';

    var COOKIE_NAME = 'hyt_cookie_consent';
    var COOKIE_EXPIRY_DAYS = 365;

    // ===== 多语言文本配置 =====
    var TEXTS = {
        en: {
            title: '🍪 We use cookies to enhance your browsing experience and analyze site traffic.',
            link: 'Privacy Policy',
            btn_accept: 'Accept All',
            btn_decline: 'Necessary Only'
        },
        zh: {
            title: '🍪 我们使用Cookie来提升您的浏览体验、分析网站流量。',
            link: '隐私政策',
            btn_accept: '接受所有',
            btn_decline: '仅必要Cookie'
        }
    };

    // ===== 检测当前语言 =====
    function detectLanguage() {
        var path = window.location.pathname;
        // 如果路径包含 /cn/ 或 /cn 或页面是中文版
        if (path.indexOf('/cn/') !== -1 || path === '/cn' || path === '/cn/') {
            return 'zh';
        }
        // 检查文件名是否以 cn- 开头（中文版新闻/产品详情）
        var fileName = path.split('/').pop();
        // 如果没有明确路径，检查页面lang属性或内容
        var htmlLang = document.documentElement.lang || '';
        if (htmlLang.indexOf('zh') === 0) {
            return 'zh';
        }
        return 'en';
    }

    // ===== 获取Cookie =====
    function getCookie(name) {
        var value = '; ' + document.cookie;
        var parts = value.split('; ' + name + '=');
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    // ===== 设置Cookie =====
    function setCookie(name, value, days) {
        var expires = '';
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + value + expires + '; path=/';
    }

    // ===== 隐藏横幅 =====
    function hideBanner() {
        var banner = document.getElementById('cookieBanner');
        if (banner) {
            banner.classList.remove('show');
        }
    }

    // ===== 接受所有Cookie =====
    function acceptCookies() {
        setCookie(COOKIE_NAME, 'accepted', COOKIE_EXPIRY_DAYS);
        hideBanner();
    }

    // ===== 拒绝非必要Cookie =====
    function declineCookies() {
        setCookie(COOKIE_NAME, 'declined', COOKIE_EXPIRY_DAYS);
        hideBanner();
    }

    // ===== 创建横幅HTML（多语言） =====
    function createBanner() {
        if (document.getElementById('cookieBanner')) {
            return;
        }

        var lang = detectLanguage();
        var text = TEXTS[lang] || TEXTS.en;

        // 隐私政策链接（根据语言切换）
        var privacyLink = lang === 'zh' ? 'privacy-policy.html' : 'privacy-policy.html';

        var banner = document.createElement('div');
        banner.id = 'cookieBanner';
        banner.className = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', lang === 'zh' ? 'Cookie同意' : 'Cookie Consent');

        banner.innerHTML = [
            '<span class="cookie-text">',
            text.title,
            ' <a href="' + privacyLink + '" target="_blank">' + text.link + '</a>',
            '。',
            '</span>',
            '<span class="cookie-buttons">',
            '<button class="cookie-btn decline" id="cookieDeclineBtn">' + text.btn_decline + '</button>',
            '<button class="cookie-btn accept" id="cookieAcceptBtn">' + text.btn_accept + '</button>',
            '</span>'
        ].join('');

        document.body.appendChild(banner);

        // 绑定按钮事件
        document.getElementById('cookieAcceptBtn').addEventListener('click', acceptCookies);
        document.getElementById('cookieDeclineBtn').addEventListener('click', declineCookies);

        // 显示横幅（如果还没有选择过）
        var consent = getCookie(COOKIE_NAME);
        if (!consent) {
            setTimeout(function() {
                banner.classList.add('show');
            }, 200);
        }
    }

    // ===== 初始化 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBanner);
    } else {
        createBanner();
    }

    // ===== 暴露接口 =====
    window.CookieConsent = {
        accept: acceptCookies,
        decline: declineCookies,
        getStatus: function() {
            return getCookie(COOKIE_NAME);
        },
        reset: function() {
            setCookie(COOKIE_NAME, '', -1);
            var banner = document.getElementById('cookieBanner');
            if (banner) {
                banner.classList.add('show');
            }
        }
    };

})();