/*
  ============================================================
  可修改设置
  ============================================================
  生日月份：BIRTH_MONTH = 9
  生日日期：BIRTH_DAY = 5

  注意：这里的月份使用普通月份数字，不再是 JavaScript 的 0-11 月。
  ============================================================
*/
const BIRTH_MONTH = 9;
const BIRTH_DAY = 5;

/*
  ============================================================
  调试按钮
  ============================================================
  想删除调试功能：
  1. 在 index.html 中删除 id="debugBtn" 的整个 button；
  2. 在本文件中删除下面这两个事件监听器：
       document.getElementById("debugBtn").addEventListener(...)
       document.getElementById("backBtn").addEventListener(...)
  ============================================================
*/

const TIME_API_URL = "https://cn.apihz.cn/api/time/getapi.php?id=10020324&key=524861e86310ab5464dc18ed84858c08&type=2";

/*
  ============================================================
  游戏链接
  ============================================================
  修改秘密游戏地址，只需要改这里的 GAME_URL。
  例如：
  const GAME_URL = "https://example.com/game";
  或：
  const GAME_URL = "game.html";
  ============================================================
*/
const GAME_URL = "game.html";

// ★ 固定时间点：2026年9月5日 00:00 UTC（即北京时间 2026-09-05 08:00）
const RELEASE_DATE = new Date(Date.UTC(2026, 8, 5)); // 月份 8 = 9月

const countdownScreen = document.getElementById("countdownScreen");
const birthdayScreen = document.getElementById("birthdayScreen");
const secretLink = document.getElementById("secretLink");
const status = document.getElementById("status");
const apiStatus = document.getElementById("apiStatus");

let debugMode = false;
let serverBaseTime = null;   // 当前使用的基准时间（来自服务器或本地降级）
let localBaseTime = null;    // 获取基准时间时对应的本地时间
let usingServerTime = false; // 标记当前是否使用服务器时间（用于显示提示）

secretLink.href = GAME_URL;

function isBirthdayToday(date) {
  return date.getUTCMonth() + 1 === BIRTH_MONTH &&
         date.getUTCDate() === BIRTH_DAY;
}

function showBirthday() {
  countdownScreen.classList.add("hidden");
  birthdayScreen.classList.remove("hidden");
  // secretLink 的显隐由 updateCountdown 统一控制
}

function showCountdown() {
  countdownScreen.classList.remove("hidden");
  birthdayScreen.classList.add("hidden");
  // secretLink 的显隐由 updateCountdown 统一控制
}

function updateCountdown(now) {
  if (debugMode) return;

  // ----- 判断是否生日，切换画面 -----
  if (isBirthdayToday(now)) {
    showBirthday();
    status.textContent = "今天就是特别的日子。";
  } else {
    showCountdown();

    // 计算距离下一个生日的倒计时
    let target = new Date(Date.UTC(now.getUTCFullYear(), BIRTH_MONTH - 1, BIRTH_DAY));
    if (target <= now) {
      target = new Date(Date.UTC(now.getUTCFullYear() + 1, BIRTH_MONTH - 1, BIRTH_DAY));
    }

    const diff = target.getTime() - now.getTime();
    const totalSeconds = Math.max(0, Math.floor(diff / 1000));

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    document.getElementById("days").textContent = String(days).padStart(2, "0");
    document.getElementById("hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("minutes").textContent = String(minutes).padStart(2, "0");
    document.getElementById("seconds").textContent = String(seconds).padStart(2, "0");
    status.textContent = "森林正在静静等待。";
  }

  // ----- ★ 判断是否达到 2026年9月5日，控制游戏链接永久显示 ★ -----
  if (now >= RELEASE_DATE) {
    secretLink.classList.remove("hidden");
  } else {
    secretLink.classList.add("hidden");
  }
}

/* ----- 设置时间基准（统一入口） ----- */
function setTimeBase(serverDate, isServer) {
  serverBaseTime = serverDate;
  localBaseTime = new Date();
  usingServerTime = isServer;

  // 更新状态提示
  if (isServer) {
    apiStatus.textContent = "时间校准完成 · " + serverDate.toLocaleString('zh-CN');
  } else {
    apiStatus.textContent = "⚠️ 使用本地时间（服务器连接失败）";
  }

  // 立即刷新倒计时和链接状态
  updateCountdown(serverDate);
}

/* ----- 从服务器获取时间（优先） ----- */
async function getServerTime() {
  try {
    apiStatus.textContent = "正在从时间服务器获取当前日期……";

    const response = await fetch(TIME_API_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Time API HTTP " + response.status);

    const data = await response.json();
    console.log("API 返回的原始数据:", data);

    const serverDate = new Date(data.msg);
    if (isNaN(serverDate.getTime())) throw new Error("无效的服务器时间");

    setTimeBase(serverDate, true);

  } catch (error) {
    console.warn("服务器时间获取失败，降级使用本地时间:", error);
    const localDate = new Date();
    setTimeBase(localDate, false);
    apiStatus.textContent = "⚠️ 使用本地时间（服务器连接失败）";
    status.textContent = "本地时间模式，请确保系统时间正确。";
  }
}

/* ----- 每秒刷新倒计时（推算当前时间） ----- */
function tick() {
  if (serverBaseTime && localBaseTime) {
    const now = new Date();
    const elapsed = now.getTime() - localBaseTime.getTime();
    const estimatedNow = new Date(serverBaseTime.getTime() + elapsed);
    updateCountdown(estimatedNow);
  }
}

// /* ===== 调试：立即进入生日画面 ===== */
// document.getElementById("debugBtn").addEventListener("click", () => {
//   debugMode = true;
//   showBirthday();
//   status.textContent = "调试模式：已立即进入生日画面。";
//   // 调试模式下强制显示链接，便于预览
//   secretLink.classList.remove("hidden");
// });

/* ===== 调试：返回倒计时 ===== */
// document.getElementById("backBtn").addEventListener("click", () => {
//   debugMode = false;
//   showCountdown();
//   getServerTime(); // 重新获取时间，刷新一切
// });

/*
  启动流程：
  1. 立即尝试从服务器获取时间
  2. 每 30 秒重新校准一次
  3. 每秒刷新显示（不发网络请求）
*/
getServerTime();
setInterval(getServerTime, 30 * 1000);
setInterval(tick, 1000);