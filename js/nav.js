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