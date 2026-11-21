/**
 * ============================================================
 *  Hua Yi Teng - 统一表单处理脚本（Cloudflare Turnstile 版本）
 *  功能：表单验证 + Turnstile 验证 + Ajax 提交 + 自定义感谢页
 *  依赖：页面中已引入
 *        https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit
 *        使用 explicit 渲染，脚本异步晚于本文件加载时通过短轮询等待 window.turnstile
 *  说明：浏览器端不做服务端校验；仅把 token 作为 cf-turnstile-response 交给 Formspree
 *        由 Formspree 在其 Dashboard 配置的 Turnstile Secret 完成校验
 *  最后更新: 2026-11-21
 * ============================================================
 */

(function () {
    'use strict';

    // ============================================================
    // 1. 配置
    // ============================================================
    var CONFIG = {
        // 表单提交成功后，延迟跳转到感谢页（毫秒）
        redirectDelay: 1500,
        // 提示信息自动消失时间（毫秒）
        messageAutoHide: 8000,
        // 等待 window.turnstile 可用的最长时间（毫秒）
        turnstileWaitTimeout: 15000,
        // 等待 window.turnstile 的轮询间隔（毫秒）
        turnstilePollInterval: 200,
        // 感谢页：相对「当前目录」解析
        //   /contact.html        -> /thank-you.html
        //   /cn/contact.html     -> /cn/thank-you.html（不会出现 cn/cn）
        thankYouPage: 'thank-you.html'
    };

    // ============================================================
    // 2. 多语言提示（依据 <html lang> 与路径判断）
    // ============================================================
    var I18N = {
        en: {
            required: 'This field is required.',
            email: 'Please enter a valid email address.',
            name: 'Name must be at least 2 characters.',
            message: 'Please describe your requirements in at least 10 characters.',
            consent: 'Please accept the Privacy Policy to continue.',
            invalidForm: 'Please complete the highlighted fields before submitting.',
            captchaIncomplete: 'Please complete the verification before submitting.',
            captchaLoadFailed: 'The verification widget could not be loaded. Please refresh the page and try again.',
            captchaFailed: 'Verification failed. Please refresh the page and try again.',
            sending: 'Sending...',
            success: 'Your inquiry has been sent successfully. We will reply within 24 hours.',
            submitFailed: 'Submission failed. Please try again later.',
            networkError: 'Network error. Please check your connection and try again.'
        },
        zh: {
            required: '此字段为必填项。',
            email: '请输入有效的邮箱地址。',
            name: '姓名至少需要 2 个字符。',
            message: '请详细描述您的需求（至少 10 个字符）。',
            consent: '请同意隐私政策以继续。',
            invalidForm: '请完善表单中标记的必填项后再提交。',
            captchaIncomplete: '请先完成人机验证后再提交。',
            captchaLoadFailed: '验证码组件加载失败，请刷新页面后重试。',
            captchaFailed: '验证失败，请刷新页面后重试。',
            sending: '发送中...',
            success: '您的询盘已发送成功！我们将在 24 小时内回复您。',
            submitFailed: '提交失败，请稍后重试。',
            networkError: '网络连接异常，请检查网络后重试。'
        }
    };

    // 检测当前页面语言
    function detectLanguage() {
        var path = window.location.pathname || '';
        if (/\/cn(\/|$)/i.test(path)) {
            return 'zh';
        }
        var htmlLang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
        if (htmlLang.indexOf('zh') === 0) {
            return 'zh';
        }
        return 'en';
    }

    var LANG = detectLanguage();
    var T = I18N[LANG] || I18N.en;

    // 感谢页路径：相对当前页面解析为绝对地址
    //   /contact.html    -> /thank-you.html
    //   /cn/contact.html -> /cn/thank-you.html（不会出现 cn/cn）
    function getThankYouUrl() {
        try {
            return new URL(CONFIG.thankYouPage, window.location.href).href;
        } catch (e) {
            return CONFIG.thankYouPage;
        }
    }

    // ============================================================
    // 3. 工具函数
    // ============================================================

    function getTurnstile() {
        if (typeof window.turnstile !== 'undefined' && window.turnstile && typeof window.turnstile.render === 'function') {
            return window.turnstile;
        }
        return null;
    }

    // 安全的初始化等待：Turnstile 脚本可能异步晚于本脚本加载
    function whenTurnstileReady(callback) {
        var startTime = Date.now();
        var settled = false;

        function finish(api) {
            if (settled) {
                return;
            }
            settled = true;
            callback(api);
        }

        (function poll() {
            var api = getTurnstile();
            if (api) {
                finish(api);
                return;
            }
            if (Date.now() - startTime >= CONFIG.turnstileWaitTimeout) {
                finish(null);
                return;
            }
            window.setTimeout(poll, CONFIG.turnstilePollInterval);
        })();

        // 脚本 load 事件到达时可提前结束等待
        if (!window.__hytTurnstileLoadBound) {
            window.__hytTurnstileLoadBound = true;
            window.addEventListener('load', function () {
                var api = getTurnstile();
                if (api) {
                    renderAllWidgets();
                }
            });
        }
    }

    function scrollToElement(el) {
        if (!el || typeof el.getBoundingClientRect !== 'function') {
            return;
        }
        var top = el.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0) - 160;
        try {
            window.scrollTo({ top: top, behavior: 'smooth' });
        } catch (e) {
            window.scrollTo(0, top);
        }
    }

    function showMessage(form, type, text) {
        if (!form) {
            return;
        }
        var oldMessages = form.querySelectorAll('.form-message');
        for (var i = 0; i < oldMessages.length; i++) {
            oldMessages[i].parentNode.removeChild(oldMessages[i]);
        }

        var styles = {
            success: { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32', icon: '\u2705' },
            error: { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828', icon: '\u274C' },
            warning: { bg: '#FFF8E1', border: '#FFE082', text: '#F57F17', icon: '\u26A0\uFE0F' }
        };
        var style = styles[type] || styles.error;

        var box = document.createElement('div');
        box.className = 'form-message form-message-' + type;
        box.setAttribute('role', 'alert');
        box.style.cssText = 'padding:12px 16px;border-radius:8px;margin-bottom:16px;font-weight:500;' +
            'font-size:14px;display:flex;align-items:center;gap:8px;' +
            'background:' + style.bg + ';color:' + style.text + ';border:1px solid ' + style.border + ';';

        var iconEl = document.createElement('span');
        iconEl.textContent = style.icon;
        var textEl = document.createElement('span');
        textEl.textContent = text;

        box.appendChild(iconEl);
        box.appendChild(textEl);

        if (form.firstChild) {
            form.insertBefore(box, form.firstChild);
        } else {
            form.appendChild(box);
        }

        if (type === 'success') {
            window.setTimeout(function () {
                if (box.parentNode) {
                    box.style.transition = 'opacity .3s';
                    box.style.opacity = '0';
                    window.setTimeout(function () {
                        if (box.parentNode) {
                            box.parentNode.removeChild(box);
                        }
                    }, 320);
                }
            }, CONFIG.messageAutoHide);
        }
    }

    // 验证单个字段
    function validateField(field) {
        var type = (field.getAttribute('type') || field.tagName || '').toLowerCase();
        var value = (field.value || '').replace(/^\s+|\s+$/g, '');
        var name = field.getAttribute('name') || '';

        if (field.required && !value) {
            return { valid: false, message: T.required };
        }

        if (type === 'email' && value) {
            var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(value)) {
                return { valid: false, message: T.email };
            }
        }

        if (name === 'name' && value && value.length < 2) {
            return { valid: false, message: T.name };
        }

        if (name === 'message' && value && value.length < 10) {
            return { valid: false, message: T.message };
        }

        return { valid: true, message: '' };
    }

    var FIELD_ERROR_STYLE = 'color:#C62828;font-size:12px;display:block;margin-top:4px;';

    function showFieldError(field, message) {
        field.classList.add('is-invalid');
        var next = field.nextElementSibling;
        var errorEl = (next && next.classList && next.classList.contains('field-error')) ? next : null;
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'field-error';
            errorEl.style.cssText = FIELD_ERROR_STYLE;
            if (field.parentNode) {
                field.parentNode.insertBefore(errorEl, field.nextSibling);
            }
        }
        errorEl.textContent = message;
        return errorEl;
    }

    function clearFieldError(field) {
        field.classList.remove('is-invalid');
        var next = field.nextElementSibling;
        if (next && next.classList && next.classList.contains('field-error') && next.parentNode) {
            next.parentNode.removeChild(next);
        }
    }

    function isSkippableField(field) {
        var type = (field.getAttribute('type') || '').toLowerCase();
        var name = field.getAttribute('name') || '';
        if (type === 'hidden' || type === 'submit' || type === 'button') {
            return true;
        }
        if (name === '_gotcha' || name === 'consent' || name === 'cf-turnstile-response') {
            return true;
        }
        if (field.closest && field.closest('.cf-turnstile')) {
            return true;
        }
        return false;
    }

    // ============================================================
    // 4. Turnstile 控件管理（每个表单独立 widget ID）
    // ============================================================
    var formStates = [];

    function findFormState(form) {
        for (var i = 0; i < formStates.length; i++) {
            if (formStates[i].form === form) {
                return formStates[i];
            }
        }
        return null;
    }

    function renderWidget(state) {
        var api = getTurnstile();
        if (!api || !state.widgetEl) {
            return false;
        }
        if (state.widgetId !== null && state.widgetId !== undefined) {
            return true;
        }
        if (state.widgetEl.getAttribute('data-hyt-turnstile-rendered') === '1') {
            return state.widgetId !== null && state.widgetId !== undefined;
        }

        try {
            state.widgetId = api.render(state.widgetEl, {
                sitekey: state.widgetEl.getAttribute('data-sitekey'),
                action: state.widgetEl.getAttribute('data-action') || 'contact',
                theme: state.widgetEl.getAttribute('data-theme') || 'light',
                'error-callback': function () {
                    state.widgetErrored = true;
                },
                'timeout-callback': function () {
                    state.widgetErrored = true;
                },
                'expired-callback': function () {
                    state.widgetErrored = false;
                }
            });
            state.widgetEl.setAttribute('data-hyt-turnstile-rendered', '1');
            state.widgetErrored = false;
            return true;
        } catch (e) {
            state.widgetId = null;
            return false;
        }
    }

    function renderAllWidgets() {
        for (var i = 0; i < formStates.length; i++) {
            renderWidget(formStates[i]);
        }
    }

    // 通过本表单自己的 widget ID 取 token
    function getToken(state) {
        var api = getTurnstile();
        if (!api || state.widgetId === null || state.widgetId === undefined) {
            return null;
        }
        try {
            var token = api.getResponse(state.widgetId);
            return token || null;
        } catch (e) {
            return null;
        }
    }

    // 通过本表单自己的 widget ID 重置（单次 token，失败后可重试）
    function resetWidget(state) {
        var api = getTurnstile();
        state.widgetErrored = false;
        if (!api || state.widgetId === null || state.widgetId === undefined) {
            return;
        }
        try {
            api.reset(state.widgetId);
        } catch (e) {
            // 静默处理重置失败
        }
    }

    // ============================================================
    // 5. 核心提交（Ajax -> Formspree）
    // ============================================================
    function submitForm(state) {
        var form = state.form;
        var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        var originalHtml = submitBtn ? (submitBtn.getAttribute('data-hyt-original-html') || '') : '';

        if (submitBtn && !originalHtml) {
            originalHtml = submitBtn.innerHTML;
            submitBtn.setAttribute('data-hyt-original-html', originalHtml);
        }

        function setSending(sending) {
            if (!submitBtn) {
                return;
            }
            submitBtn.disabled = sending;
            if (sending) {
                if (submitBtn.tagName === 'INPUT') {
                    submitBtn.value = T.sending;
                } else {
                    submitBtn.textContent = T.sending;
                }
            } else {
                if (submitBtn.tagName === 'INPUT') {
                    submitBtn.value = originalHtml;
                } else {
                    submitBtn.innerHTML = originalHtml;
                }
            }
        }


        // 1) 取 token：组件未加载 / widget 未渲染 / token 为空 -> 阻止提交
        var api = getTurnstile();
        if (!api) {
            showMessage(form, 'error', T.captchaLoadFailed);
            scrollToElement(state.widgetEl);
            return;
        }

        if (state.widgetId === null || state.widgetId === undefined) {
            renderWidget(state);
        }

        var token = getToken(state);
        if (!token) {
            if (state.widgetId === null || state.widgetId === undefined || state.widgetErrored) {
                showMessage(form, 'error', T.captchaLoadFailed);
            } else {
                showMessage(form, 'warning', T.captchaIncomplete);
            }
            scrollToElement(state.widgetEl);
            return;
        }

        var action = form.getAttribute('action');
        if (!action) {
            showMessage(form, 'error', T.submitFailed);
            return;
        }

        // 2) 防重复提交 + 按钮状态
        state.submitting = true;
        setSending(true);

        // 3) 组装 FormData，token 以 cf-turnstile-response 提交
        var formData = new FormData(form);
        if (typeof formData.set === 'function') {
            formData.set('cf-turnstile-response', token);
        } else {
            formData.append('cf-turnstile-response', token);
        }

        var finished = false;
        function done() {
            if (finished) {
                return;
            }
            finished = true;
            state.submitting = false;
            setSending(false);
            resetWidget(state);
        }

        // 4) 发送请求
        fetch(action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(function (response) {
                if (response.ok) {
                    showMessage(form, 'success', T.success);
                    try {
                        form.reset();
                    } catch (e) {
                        // 忽略重置异常
                    }
                    done();
                    window.setTimeout(function () {
                        window.location.href = getThankYouUrl();
                    }, CONFIG.redirectDelay);
                    return;
                }

                return response.json().then(function (data) {
                    var errorMsg = (data && data.error) ? String(data.error) : '';
                    var lower = errorMsg.toLowerCase();
                    if (lower && (lower.indexOf('captcha') !== -1 || lower.indexOf('turnstile') !== -1)) {
                        errorMsg = T.captchaFailed;
                    }
                    if (!errorMsg) {
                        errorMsg = T.submitFailed;
                    }
                    showMessage(form, 'error', errorMsg);
                    done();
                }).catch(function () {
                    showMessage(form, 'error', T.submitFailed);
                    done();
                });
            })
            .catch(function () {
                showMessage(form, 'error', T.networkError);
                done();
            });
    }

    // ============================================================
    // 6. 初始化
    // ============================================================
    function initForms() {
        var forms = document.querySelectorAll('form[action*="formspree.io"]');
        if (!forms.length) {
            return;
        }

        for (var i = 0; i < forms.length; i++) {
            (function (form) {
                var widgetEl = form.querySelector('.cf-turnstile');
                if (!widgetEl) {
                    // 极少数页面控件与表单同级，做一次页面级兜底
                    widgetEl = document.querySelector('.cf-turnstile');
                }

                var state = {
                    form: form,
                    widgetEl: widgetEl,
                    widgetId: null,
                    widgetErrored: false,
                    submitting: false
                };
                formStates.push(state);

                var fields = form.querySelectorAll('input, textarea, select');

                // --- 6a. 失焦校验 ---
                for (var j = 0; j < fields.length; j++) {
                    (function (field) {
                        field.addEventListener('blur', function () {
                            if (isSkippableField(field)) {
                                return;
                            }
                            var result = validateField(field);
                            if (!result.valid && (field.value || '').replace(/^\s+|\s+$/g, '')) {
                                showFieldError(field, result.message);
                            } else {
                                clearFieldError(field);
                            }
                        });

                        field.addEventListener('input', function () {
                            if (field.classList && field.classList.contains('is-invalid')) {
                                var result = validateField(field);
                                if (result.valid || !(field.value || '').replace(/^\s+|\s+$/g, '')) {
                                    clearFieldError(field);
                                }
                            }
                        });

                        field.addEventListener('change', function () {
                            if (field.getAttribute('name') === 'consent' && field.checked) {
                                var label = field.closest ? field.closest('label') : null;
                                if (label) {
                                    var err = label.querySelector('.field-error');
                                    if (err && err.parentNode) {
                                        err.parentNode.removeChild(err);
                                    }
                                }
                                field.classList.remove('is-invalid');
                            }
                        });
                    })(fields[j]);
                }

                // --- 6b. 提交前全量校验 + 提交 ---
                form.addEventListener('submit', function (e) {
                    e.preventDefault();

                    if (state.submitting) {
                        return;
                    }

                    var isValid = true;
                    var firstInvalid = null;
                    var allFields = form.querySelectorAll('input, textarea, select');

                    for (var k = 0; k < allFields.length; k++) {
                        var field = allFields[k];
                        if (isSkippableField(field)) {
                            continue;
                        }
                        var result = validateField(field);
                        if (!result.valid) {
                            isValid = false;
                            showFieldError(field, result.message);
                            if (!firstInvalid) {
                                firstInvalid = field;
                            }
                        } else {
                            clearFieldError(field);
                        }
                    }

                    // GDPR 同意复选框
                    var consent = form.querySelector('input[name="consent"]');
                    if (consent) {
                        var consentLabel = consent.closest ? consent.closest('label') : null;
                        if (!consent.checked) {
                            isValid = false;
                            consent.classList.add('is-invalid');
                            if (consentLabel && !consentLabel.querySelector('.field-error')) {
                                var consentError = document.createElement('span');
                                consentError.className = 'field-error';
                                consentError.style.cssText = FIELD_ERROR_STYLE;
                                consentError.textContent = T.consent;
                                consentLabel.appendChild(consentError);
                            }
                            if (!firstInvalid) {
                                firstInvalid = consent;
                            }
                        } else {
                            consent.classList.remove('is-invalid');
                            if (consentLabel) {
                                var oldConsentError = consentLabel.querySelector('.field-error');
                                if (oldConsentError && oldConsentError.parentNode) {
                                    oldConsentError.parentNode.removeChild(oldConsentError);
                                }
                            }
                        }
                    }

                    if (!isValid) {
                        showMessage(form, 'warning', T.invalidForm);
                        if (firstInvalid) {
                            scrollToElement(firstInvalid);
                            try {
                                firstInvalid.focus({ preventScroll: true });
                            } catch (err) {
                                firstInvalid.focus();
                            }
                        }
                        return;
                    }

                    // 组件未加载：明确提示并滚动到验证码
                    if (!getTurnstile()) {
                        showMessage(form, 'error', T.captchaLoadFailed);
                        scrollToElement(widgetEl);
                        return;
                    }

                    submitForm(state);
                });

                // 先尝试立即渲染（脚本可能已加载完成）
                renderWidget(state);
            })(forms[i]);
        }

        // Turnstile 脚本异步晚到：短轮询等待后补渲染
        if (!getTurnstile()) {
            whenTurnstileReady(function (api) {
                if (api) {
                    renderAllWidgets();
                }
            });
        }
    }

    // ============================================================
    // 7. 启动
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initForms);
    } else {
        initForms();
    }
})();
