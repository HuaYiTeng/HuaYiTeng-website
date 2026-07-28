/**
 * ============================================================
 *  Hua Yi Teng - 统一表单处理脚本（Google reCAPTCHA v2 版本）
 *  功能：表单验证 + reCAPTCHA 验证 + Ajax 提交 + 自定义感谢页
 *  最后更新: 2026-07-28
 * ============================================================
 */

(function() {
    'use strict';

    // ============================================================
    // 1. 配置
    // ============================================================
    var CONFIG = {
        // 表单提交成功后，延迟跳转到感谢页（毫秒）
        redirectDelay: 1500,
        // 提示信息自动消失时间（毫秒）
        messageAutoHide: 8000,
        // 感谢页路径（中英不同，由页面语言自动判断）
        thankYouPage: {
            en: 'thank-you.html',
            zh: 'cn/thank-you.html'
        }
    };

    // ============================================================
    // 2. 工具函数
    // ============================================================

    // 检测当前页面语言
    function detectLanguage() {
        var path = window.location.pathname;
        if (path.indexOf('/cn/') !== -1 || path === '/cn' || path === '/cn/') {
            return 'zh';
        }
        var htmlLang = document.documentElement.lang || '';
        if (htmlLang.indexOf('zh') === 0) {
            return 'zh';
        }
        return 'en';
    }

    // 获取当前页面基础路径（用于相对路径跳转）
    function getBasePath() {
        var path = window.location.pathname;
        if (path.indexOf('/cn/') !== -1 || path === '/cn' || path === '/cn/') {
            return '../';
        }
        return '';
    }

    // 获取感谢页完整路径
    function getThankYouUrl() {
        var lang = detectLanguage();
        var base = getBasePath();
        var page = lang === 'zh' ? CONFIG.thankYouPage.zh : CONFIG.thankYouPage.en;
        return base ? base + page : page;
    }

    // 显示表单消息
    function showMessage($form, type, text) {
        $form.find('.form-message').remove();

        var colors = {
            success: {
                bg: '#E8F5E9',
                border: '#A5D6A7',
                text: '#2E7D32',
                icon: '✅'
            },
            error: {
                bg: '#FFEBEE',
                border: '#EF9A9A',
                text: '#C62828',
                icon: '❌'
            },
            warning: {
                bg: '#FFF8E1',
                border: '#FFE082',
                text: '#F57F17',
                icon: '⚠️'
            }
        };

        var style = colors[type] || colors.error;
        var messageHtml = [
            '<div class="form-message" style="',
            'padding:12px 16px;',
            'border-radius:8px;',
            'background:' + style.bg + ';',
            'color:' + style.text + ';',
            'border:1px solid ' + style.border + ';',
            'margin-bottom:16px;',
            'font-weight:500;',
            'font-size:14px;',
            'display:flex;',
            'align-items:center;',
            'gap:8px;',
            '">',
            '<span>' + style.icon + '</span>',
            '<span>' + text + '</span>',
            '</div>'
        ].join('');

        $form.prepend(messageHtml);

        if (type === 'success') {
            setTimeout(function() {
                $form.find('.form-message').fadeOut(300, function() {
                    $(this).remove();
                });
            }, CONFIG.messageAutoHide);
        }
    }

    // 验证单个字段
    function validateField($field) {
        var type = $field.attr('type') || $field.prop('tagName').toLowerCase();
        var value = $field.val().trim();
        var isValid = true;
        var errorMsg = '';

        if ($field.prop('required') && !value) {
            return { valid: false, message: '此字段为必填项' };
        }

        if (type === 'email' && value) {
            var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(value)) {
                return { valid: false, message: '请输入有效的邮箱地址' };
            }
        }

        if ($field.attr('name') === 'name' && value && value.length < 2) {
            return { valid: false, message: '姓名至少需要2个字符' };
        }

        if ($field.attr('name') === 'message' && value && value.length < 10) {
            return { valid: false, message: '请详细描述您的需求（至少10个字符）' };
        }

        return { valid: true, message: '' };
    }

    // ============================================================
    // 3. 获取 reCAPTCHA 令牌
    // ============================================================

    function getRecaptchaToken() {
        // 检查 grecaptcha 是否已加载
        if (typeof grecaptcha === 'undefined') {
            return null;
        }
        try {
            var token = grecaptcha.getResponse();
            return token || null;
        } catch (e) {
            return null;
        }
    }

    // 重置 reCAPTCHA
    function resetRecaptcha() {
        if (typeof grecaptcha !== 'undefined') {
            try {
                grecaptcha.reset();
            } catch (e) {
                // 静默处理重置失败
            }
        }
    }

    // ============================================================
    // 4. 核心提交函数（支持 reCAPTCHA）
    // ============================================================

    function submitForm($form) {
        var $submitBtn = $form.find('button[type="submit"]');
        var originalText = $submitBtn.text();
        var action = $form.attr('action');

        // --- 1. 获取 reCAPTCHA 令牌 ---
        var recaptchaToken = getRecaptchaToken();

        if (!recaptchaToken) {
            showMessage($form, 'warning', '⚠️ 请完成 "我不是机器人" 验证后再提交。');
            // 滚动到验证码位置
            var $recaptcha = $form.find('.g-recaptcha');
            if ($recaptcha.length) {
                $('html, body').animate({
                    scrollTop: $recaptcha.offset().top - 160
                }, 300);
            }
            return;
        }

        // --- 2. 禁用按钮 ---
        $submitBtn.prop('disabled', true).text('发送中...');

        // --- 3. 构建表单数据 ---
        var formData = new FormData($form[0]);
        // 添加 reCAPTCHA 令牌到表单数据
        formData.append('g-recaptcha-response', recaptchaToken);

        // --- 4. 发送请求 ---
        fetch(action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(function(response) {
            if (response.ok) {
                showMessage($form, 'success', '✅ 您的询盘已发送成功！我们将在24小时内回复您。');
                $form[0].reset();
                // 重置 reCAPTCHA
                resetRecaptcha();

                setTimeout(function() {
                    window.location.href = getThankYouUrl();
                }, CONFIG.redirectDelay);
            } else {
                return response.json().then(function(data) {
                    var errorMsg = data.error || '提交失败，请稍后重试。';
                    // 检查是否是 reCAPTCHA 相关错误
                    if (errorMsg.toLowerCase().includes('captcha') || errorMsg.toLowerCase().includes('recaptcha')) {
                        errorMsg = '验证码验证失败，请刷新页面后重试。';
                    }
                    showMessage($form, 'error', '❌ ' + errorMsg);
                    resetRecaptcha();
                }).catch(function() {
                    showMessage($form, 'error', '❌ 提交失败，请稍后重试。');
                    resetRecaptcha();
                });
            }
        })
        .catch(function() {
            showMessage($form, 'error', '❌ 网络连接异常，请检查网络后重试。');
            resetRecaptcha();
        })
        .finally(function() {
            $submitBtn.prop('disabled', false).text(originalText);
        });
    }

    // ============================================================
    // 5. 初始化所有表单
    // ============================================================

    function initForms() {
        var $forms = $('form[action*="formspree.io"]');

        $forms.each(function() {
            var $form = $(this);

            // --- 5a. 实时字段验证 ---
            $form.find('input, textarea, select').on('blur', function() {
                var $field = $(this);
                if ($field.attr('type') === 'hidden' || $field.attr('name') === '_gotcha') {
                    return;
                }
                var result = validateField($field);
                if (!result.valid && $field.val().trim()) {
                    $field.addClass('is-invalid');
                    var $error = $field.siblings('.field-error');
                    if (!$error.length) {
                        $error = $('<span class="field-error" style="color:#C62828;font-size:12px;display:block;margin-top:4px;"></span>');
                        $field.after($error);
                    }
                    $error.text(result.message);
                } else {
                    $field.removeClass('is-invalid');
                    $field.siblings('.field-error').remove();
                }
            });

            // --- 5b. 输入时清除错误状态 ---
            $form.find('input, textarea, select').on('input change', function() {
                var $field = $(this);
                if ($field.hasClass('is-invalid')) {
                    var result = validateField($field);
                    if (result.valid || !$field.val().trim()) {
                        $field.removeClass('is-invalid');
                        $field.siblings('.field-error').remove();
                    }
                }
            });

            // --- 5c. 提交前全量验证 ---
            $form.on('submit', function(e) {
                e.preventDefault();

                var $fields = $form.find('input, textarea, select');
                var isValid = true;
                var firstInvalid = null;

                $fields.each(function() {
                    var $field = $(this);
                    if ($field.attr('type') === 'hidden' || $field.attr('name') === '_gotcha') {
                        return;
                    }
                    var result = validateField($field);
                    if (!result.valid) {
                        isValid = false;
                        $field.addClass('is-invalid');
                        var $error = $field.siblings('.field-error');
                        if (!$error.length) {
                            $error = $('<span class="field-error" style="color:#C62828;font-size:12px;display:block;margin-top:4px;"></span>');
                            $field.after($error);
                        }
                        $error.text(result.message);
                        if (!firstInvalid) {
                            firstInvalid = $field;
                        }
                    } else {
                        $field.removeClass('is-invalid');
                        $field.siblings('.field-error').remove();
                    }
                });

                // 检查 GDPR 同意复选框
                var $consent = $form.find('input[name="consent"]');
                if ($consent.length && !$consent.prop('checked')) {
                    isValid = false;
                    $consent.addClass('is-invalid');
                    var $consentError = $consent.closest('label').find('.field-error');
                    if (!$consentError.length) {
                        $consentError = $('<span class="field-error" style="color:#C62828;font-size:12px;display:block;margin-top:4px;">请同意隐私政策以继续</span>');
                        $consent.closest('label').append($consentError);
                    }
                    if (!firstInvalid) {
                        firstInvalid = $consent;
                    }
                } else {
                    $consent.removeClass('is-invalid');
                    $consent.closest('label').find('.field-error').remove();
                }

                if (!isValid) {
                    if (firstInvalid) {
                        $('html, body').animate({
                            scrollTop: firstInvalid.offset().top - 120
                        }, 300);
                        firstInvalid.focus();
                    }
                    showMessage($form, 'warning', '⚠️ 请完善表单中标记的必填项后再提交。');
                    return;
                }

                // 检查 reCAPTCHA 是否已加载
                if (typeof grecaptcha === 'undefined') {
                    showMessage($form, 'error', '❌ 验证码组件加载失败，请刷新页面后重试。');
                    return;
                }

                // 所有验证通过，提交表单
                submitForm($form);
            });
        });
    }

    // ============================================================
    // 6. 启动（在 DOM 加载完成后执行）
    // ============================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof jQuery !== 'undefined') {
                initForms();
            } else {
                console.warn('jQuery 未加载，表单功能无法初始化');
            }
        });
    } else {
        if (typeof jQuery !== 'undefined') {
            initForms();
        }
    }

})();