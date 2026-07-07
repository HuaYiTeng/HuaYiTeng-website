/**
 * ============================================================
 *  Hua Yi Teng - 统一交互脚本（语言切换 + Cookie + 手机菜单）
 *  功能：移动端菜单统一、语言切换、GDPR Cookie 同意
 *  最后更新: 2026-07-06
 * ============================================================
 */
'use strict';

$(function() {

    // ============================================================
    //  1. 移动端菜单统一交互（同时控制首页 .header 和内页 .nyheader）
    // ============================================================
    function initUnifiedMobileMenu() {
        // 选取所有导航容器
        var $headers = $('.header, .nyheader');
        var $handles = $headers.find('.nav_handle');
        var $menus = $headers.find('.inmuen');
        var $body = $('body');

        // 如果页面上没有导航，直接退出
        if ($handles.length === 0 || $menus.length === 0) return;

        // 给所有包含二级菜单的 li 自动添加 .has-submenu 类
        $menus.find('ul li .erji').each(function() {
            $(this).closest('li').addClass('has-submenu');
        });

        // 重新获取带子菜单的项
        var $subItems = $menus.find('li.has-submenu');

        // --- 1. 汉堡按钮点击：展开/收起全屏菜单 ---
$handles.off('click.unified').on('click.unified', function(e) {
    e.stopPropagation();
    var $handle = $(this);
    var $menu = $handle.closest('.header, .nyheader').find('.inmuen');

    $handle.toggleClass('on');

    if ($menu.hasClass('active')) {
        // 关闭菜单
        $menu.removeClass('active');
        $body.removeClass('menu-open');
        // 收起所有展开的子菜单
        $subItems.removeClass('open');
        $subItems.find('.erji').slideUp(200);
    } else {
        // 打开菜单
        $menu.addClass('active');
        $body.addClass('menu-open');
    }
});

        // --- 2. 二级菜单点击展开/收起（带动画） ---
$subItems.off('click.unified').on('click.unified', function(e) {
    var $target = $(e.target);
    // 只处理点击父级 <a> 标签
    if ($target.is('a') && $target.closest('.has-submenu').length) {
        var $parent = $target.closest('.has-submenu');
        var $sub = $parent.find('.erji');
        var isOpen = $parent.hasClass('open');

        // 只有当点击的是父级菜单（即点击的是 .has-submenu 的直接 <a> 标签）时才阻止跳转
        if ($target.closest('.has-submenu').children('a').is($target)) {
            e.preventDefault();  // 阻止父级菜单跳转（如 "Products"）
        }

        if (isOpen) {
            $parent.removeClass('open');
            $sub.slideUp(250);
        } else {
            $parent.addClass('open');
            $sub.slideDown(300);
        }
    }
});

        // --- 3. 点击子菜单项后自动关闭整个菜单（提升体验） ---
        $menus.find('.erji .li').off('click.unified').on('click.unified', function() {
            var $menu = $(this).closest('.inmuen');
            if ($menu.is(':visible')) {
                var $handle = $menu.closest('.header, .nyheader').find('.nav_handle');
                // 收起所有子菜单
                $subItems.removeClass('open');
                $subItems.find('.erji').slideUp(150);
                // 延迟关闭主菜单
                setTimeout(function() {
                    $handle.removeClass('on');
                    $menu.slideUp(300, function() {
                        $menu.removeClass('active');
                        $body.removeClass('menu-open');
                    });
                }, 200);
            }
        });

        // --- 4. 点击页面空白区域关闭菜单 ---
        $(document).off('click.unified').on('click.unified', function(e) {
            var $target = $(e.target);
            // 如果点击的不是导航内部，且菜单是打开的
            if ($target.closest('.header, .nyheader').length === 0) {
                var $openMenus = $menus.filter('.active:visible');
                if ($openMenus.length) {
                    $handles.removeClass('on');
                    $menus.removeClass('active');
                    $body.removeClass('menu-open');
                    $subItems.removeClass('open');
                    $subItems.find('.erji').slideUp(200);
                }
            }
        });

        // --- 5. ESC 键关闭菜单 ---
        $(document).off('keydown.unified').on('keydown.unified', function(e) {
            if (e.key === 'Escape') {
                var $openMenus = $menus.filter('.active:visible');
                if ($openMenus.length) {
                    $handles.removeClass('on');
                    $menus.slideUp(300, function() {
                        $menus.removeClass('active');
                        $body.removeClass('menu-open');
                    });
                    $subItems.removeClass('open');
                    $subItems.find('.erji').slideUp(200);
                }
            }
        });

        // --- 6. 窗口尺寸变化时重置菜单状态（从手机切回平板/电脑） ---
        var windowWidth = $(window).width();
        $(window).off('resize.unified').on('resize.unified', function() {
            var newWidth = $(window).width();
            // 当宽度大于 768px 时（即离开手机模式），强制重置所有菜单状态
            if (newWidth > 768 && windowWidth <= 768) {
                $handles.removeClass('on');
                $menus.removeClass('active').removeAttr('style');
                $body.removeClass('menu-open');
                $subItems.removeClass('open');
                $subItems.find('.erji').removeAttr('style');
            }
            windowWidth = newWidth;
        });
    }

    // 执行统一菜单初始化
    initUnifiedMobileMenu();


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
            if (path.indexOf('/cn/') !== -1 || path === '/cn' || path === '/cn/') {
                return 'zh';
            }
            var segments = path.split('/');
            for (var i = 0; i < segments.length; i++) {
                if (segments[i] === 'cn') return 'zh';
            }
            return 'en';
        }

        function getCurrentFileName() {
            var path = getCurrentPath();
            if (!path || path === '/' || path === '') return 'index.html';
            if (path.endsWith('/')) return 'index.html';
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
            if (currentLang === targetLang) return window.location.href;
            var fileName = getCurrentFileName();
            if (currentLang === 'zh' && targetLang === 'en') return '../' + fileName;
            if (currentLang === 'en' && targetLang === 'zh') return 'cn/' + fileName;
            return window.location.href;
        }

        function isExcluded() {
            var path = getCurrentPath();
            for (var i = 0; i < CONFIG.excludePatterns.length; i++) {
                if (CONFIG.excludePatterns[i].test(path)) return true;
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
            if (!dropdown || !btn) return;
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
                        setTimeout(function() { btn.classList.remove('switching'); }, 300);
                    }
                });
            });

            window.SwitchLanguage = function() {
                dropdown.classList.toggle('open');
                var isOpen = dropdown.classList.contains('open');
                btn.setAttribute('aria-expanded', isOpen);
            };

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


    // ============================================================
    //  3. Cookie 同意横幅（GDPR 合规）
    // ============================================================
    (function() {
        'use strict';

        var COOKIE_NAME = 'hyt_cookie_consent';
        var COOKIE_EXPIRY_DAYS = 365;

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

        function detectLanguage() {
            var path = window.location.pathname;
            if (path.indexOf('/cn/') !== -1 || path === '/cn' || path === '/cn/') return 'zh';
            var htmlLang = document.documentElement.lang || '';
            if (htmlLang.indexOf('zh') === 0) return 'zh';
            return 'en';
        }

        function getCookie(name) {
            var value = '; ' + document.cookie;
            var parts = value.split('; ' + name + '=');
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }

        function setCookie(name, value, days) {
            var expires = '';
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
                expires = '; expires=' + date.toUTCString();
            }
            document.cookie = name + '=' + value + expires + '; path=/';
        }

        function hideBanner() {
            var banner = document.getElementById('cookieBanner');
            if (banner) banner.classList.remove('show');
        }

        function acceptCookies() {
            setCookie(COOKIE_NAME, 'accepted', COOKIE_EXPIRY_DAYS);
            hideBanner();
        }

        function declineCookies() {
            setCookie(COOKIE_NAME, 'declined', COOKIE_EXPIRY_DAYS);
            hideBanner();
        }

        function createBanner() {
            if (document.getElementById('cookieBanner')) return;
            var lang = detectLanguage();
            var text = TEXTS[lang] || TEXTS.en;
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

            document.getElementById('cookieAcceptBtn').addEventListener('click', acceptCookies);
            document.getElementById('cookieDeclineBtn').addEventListener('click', declineCookies);

            var consent = getCookie(COOKIE_NAME);
            if (!consent) {
                setTimeout(function() { banner.classList.add('show'); }, 200);
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createBanner);
        } else {
            createBanner();
        }

        window.CookieConsent = {
            accept: acceptCookies,
            decline: declineCookies,
            getStatus: function() { return getCookie(COOKIE_NAME); },
            reset: function() {
                setCookie(COOKIE_NAME, '', -1);
                var banner = document.getElementById('cookieBanner');
                if (banner) banner.classList.add('show');
            }
        };

    })();

});