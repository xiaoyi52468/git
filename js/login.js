/* ============================================================
   bilibili 风格登录界面 — 交互脚本
   ============================================================ */
(function () {
  'use strict';

  /* ---------- DOM 引用 ---------- */
  const $ = (id) => document.getElementById(id);
  const modal = $('loginModal');
  const toastEl = $('toast');
  const tabs = document.querySelectorAll('.tab');
  const panes = document.querySelectorAll('.tab-pane');
  const pwdForm = $('pwdForm');
  const smsForm = $('smsForm');
  const btnCode = $('btnCode');
  const qrCanvas = $('qrCanvas');
  const qrMask = $('qrMask');
  const btnReopen = $('btnReopen');

  let toastTimer = null;
  let codeTimer = null;
  let codeCountdown = 0;
  let qrTimer = null;

  /* ---------- Toast 轻提示 ---------- */
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ---------- 选项卡切换 ---------- */
  function switchTab(tabName) {
    tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    panes.forEach((pane) => {
      pane.classList.toggle('active', pane.id === tabName + 'Form');
    });
    // 切换时清空旧错误状态
    document.querySelectorAll('.field.error').forEach((f) => f.classList.remove('error'));
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  /* ---------- 表单校验 ---------- */
  function setError(input, msg) {
    const field = input.closest('.field');
    const errEl = field.querySelector('.field-error');
    if (msg) {
      errEl.textContent = msg;
      field.classList.add('error');
    } else {
      field.classList.remove('error');
    }
    return !msg;
  }

  // 输入时自动清除错误
  document.querySelectorAll('.tab-pane input').forEach((input) => {
    input.addEventListener('input', () => {
      const field = input.closest('.field');
      if (field) field.classList.remove('error');
    });
  });

  function validatePassword() {
    const account = $('pwdAccount');
    const password = $('pwdPassword');
    let ok = true;

    if (!account.value.trim()) {
      setError(account, '请输入账号');
      ok = false;
    } else {
      setError(account, '');
    }

    if (!password.value) {
      setError(password, '请输入密码');
      ok = false;
    } else if (password.value.length < 6) {
      setError(password, '密码长度不能少于 6 位');
      ok = false;
    } else {
      setError(password, '');
    }
    return ok;
  }

  function validateSms() {
    const phone = $('smsPhone');
    const code = $('smsCode');
    let ok = true;

    if (!/^1\d{10}$/.test(phone.value.trim())) {
      setError(phone, '请输入正确的 11 位手机号');
      ok = false;
    } else {
      setError(phone, '');
    }

    if (!/^\d{4,6}$/.test(code.value.trim())) {
      setError(code, '请输入 4-6 位数字验证码');
      ok = false;
    } else {
      setError(code, '');
    }
    return ok;
  }

  pwdForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    showToast('登录成功（演示，未接入真实后端）');
    setTimeout(closeModal, 1200);
  });

  smsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateSms()) return;
    showToast('登录成功（演示，未接入真实后端）');
    setTimeout(closeModal, 1200);
  });

  /* ---------- 获取验证码（倒计时） ---------- */
  btnCode.addEventListener('click', () => {
    const phone = $('smsPhone');
    if (!/^1\d{10}$/.test(phone.value.trim())) {
      setError(phone, '请输入正确的 11 位手机号');
      return;
    }
    setError(phone, '');
    showToast('验证码已发送（演示：123456）');

    codeCountdown = 60;
    btnCode.disabled = true;
    btnCode.textContent = codeCountdown + 's 后重新获取';
    clearInterval(codeTimer);
    codeTimer = setInterval(() => {
      codeCountdown -= 1;
      if (codeCountdown <= 0) {
        clearInterval(codeTimer);
        btnCode.disabled = false;
        btnCode.textContent = '获取验证码';
      } else {
        btnCode.textContent = codeCountdown + 's 后重新获取';
      }
    }, 1000);
  });

  /* ---------- Canvas 二维码绘制 ---------- */
  const QR_SIZE = 250;      // 画布物理像素
  const QR_CELLS = 25;      // 网格数
  const CELL = QR_SIZE / QR_CELLS;

  function drawFinder(ctx, row, col) {
    const x = col * CELL;
    const y = row * CELL;
    const outer = 7 * CELL;
    ctx.fillStyle = '#111';
    ctx.fillRect(x, y, outer, outer);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + CELL, y + CELL, outer - 2 * CELL, outer - 2 * CELL);
    ctx.fillStyle = '#111';
    ctx.fillRect(x + 2 * CELL, y + 2 * CELL, outer - 4 * CELL, outer - 4 * CELL);
  }

  function isFinderArea(r, c) {
    return (r < 8 && c < 8) || (r < 8 && c >= QR_CELLS - 8) || (r >= QR_CELLS - 8 && c < 8);
  }

  function drawQR() {
    const ctx = qrCanvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, QR_SIZE, QR_SIZE);

    // 随机数据模块
    for (let r = 0; r < QR_CELLS; r++) {
      for (let c = 0; c < QR_CELLS; c++) {
        if (isFinderArea(r, c)) continue;
        if (Math.random() < 0.46) {
          ctx.fillStyle = '#18191c';
          ctx.fillRect(c * CELL, r * CELL, CELL - 0.6, CELL - 0.6);
        }
      }
    }

    // 三个定位角
    drawFinder(ctx, 0, 0);
    drawFinder(ctx, 0, QR_CELLS - 7);
    drawFinder(ctx, QR_CELLS - 7, 0);

    // 中心 Logo（粉色块 + b 字）
    const center = QR_SIZE / 2;
    const half = 4 * CELL;
    ctx.fillStyle = '#fb7299';
    ctx.fillRect(center - half, center - half, half * 2, half * 2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 46px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('b', center, center + 2);
  }

  // 模拟二维码过期
  function scheduleQRExpire() {
    clearTimeout(qrTimer);
    qrTimer = setTimeout(() => {
      qrMask.classList.add('show');
    }, 20000);
  }

  $('qrRefresh').addEventListener('click', () => {
    qrMask.classList.remove('show');
    drawQR();
    scheduleQRExpire();
    showToast('二维码已刷新（演示）');
  });

  drawQR();
  scheduleQRExpire();

  /* ---------- 弹窗开关 ---------- */
  function closeModal() {
    clearTimeout(qrTimer);
    modal.classList.add('closing');
    setTimeout(() => {
      modal.classList.add('hidden-modal');
      modal.classList.remove('closing');
      btnReopen.hidden = false;
    }, 300);
  }

  $('modalClose').addEventListener('click', closeModal);

  btnReopen.addEventListener('click', () => {
    btnReopen.hidden = true;
    modal.classList.remove('hidden-modal');
    if (qrMask.classList.contains('show')) {
      qrMask.classList.remove('show');
      drawQR();
    }
    scheduleQRExpire();
  });

  /* ---------- 演示功能占位 ---------- */
  const actionTips = {
    nav: '导航为演示功能，尚未接入页面',
    search: '搜索为演示功能',
    avatar: '个人中心为演示功能',
    forgot: '忘记密码为演示功能',
    register: '注册为演示功能',
    wechat: '微信登录为演示功能',
    weibo: '微博登录为演示功能',
    qq: 'QQ登录为演示功能',
    terms: '用户协议为演示文本',
    privacy: '隐私政策为演示文本'
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const tip = actionTips[el.dataset.action];
    if (tip) showToast(tip);
  });
})();
