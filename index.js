// hitokoto
function requestHitokoto() {
  fetch('https://v1.hitokoto.cn/?c=i')
    .then(response => response.json())
    .then(data => {
      const hitokoto = document.querySelector('#hitokoto_text')
      hitokoto.innerText = data.hitokoto + "——" + (data.from_who ? data.from_who : "") + "《" + data.from + "》"
    })
    .catch(console.error)
}


// 方法：请求值日同学
function dateConfirm(weekToday = new Date().getDay()) {
  return new Promise((resolve, reject) => {
    var week = new Array("周日", "周一", "周二", "周三", "周四", "周五", "周六");
    var chineseWeek = week[weekToday];
    if (weekToday <= 5 && weekToday >= 1) {
      // 周一~周五确认
      Swal.fire({
        title: "今天是" + chineseWeek + "！",
        showDenyButton: true,
        confirmButtonText: "冲冲冲！",
        denyButtonText: `停停停！今天有调休！`,
        timer: 5000,
        timerProgressBar: true,
      }).then((result) => {
        if (result.isDenied) {
          changeCheck().then(resolve).catch(reject);
        } else {
          resolve(weekToday - 1);
        }
      });
    } else {
      changeCheck().then(resolve).catch(reject);
    }
  });
}

async function changeCheck(w = 1) {
  var words = ["调整到周几的值日生呢？", "诶，今天又被调休了吗？"];
  const inputOptions = new Promise((resolve) => {
    resolve({
      0: "周一",
      1: "周二",
      2: "周三",
      3: "周四",
      4: "周五",
    });
  });

  const { value: color } = await Swal.fire({
    allowOutsideClick: false,
    title: words[w],
    input: "radio",
    inputOptions: inputOptions,
    inputValidator: (value) => {
      if (!value) {
        return "你没有做出选择kora！";
      }
    },
  });

  if (color) {
    return (color);
  }
}

function startCountdown(time, alertName) {

  const targetDate = new Date(time);

  if (isNaN(targetDate.getTime())) {
    return 'Invalid date format';
  }

  function updateCountdown() {
    const currentDate = new Date();
    const timeDifference = targetDate - currentDate;

    if (timeDifference <= 0) {
      clearInterval(intervalId);
      document.getElementById('welcome').innerText = alertName + '倒计时结束';
      return;
    }

    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    const countdownString = `距离${alertName}还剩${days}天${hours}小时${minutes}分钟${seconds}秒`;

    // 插入到 <h1 id="welcome"> 中
    const welcomeElement = document.getElementById('welcome');
    if (welcomeElement) {
      welcomeElement.innerText = countdownString;
    }
  }

  // 每秒更新一次倒计时
  const intervalId = setInterval(updateCountdown, 1000);
  updateCountdown(); // 立即调用一次以显示初始倒计时
}

// 读取配置文件
async function readConfig() {
  try {
    const config = await window.electronAPI.readConfig();
    if (!config || Object.keys(config).length == 0) {
      console.error('Config file is missing or empty');
      const newConfigFetched = await getNewConfig(config.route, config.version);
      if (!newConfigFetched) {
        throw new Error('Failed to fetch new config and no local config available');
      }
      await readConfig();
      return;
    }
    if (config.online) {
      const newConfigFetched = await getNewConfig(config.route, config.version);
      if (newConfigFetched) {
        await readConfig();
        return;
      }
    }

    // 提示配置文件
    const dutyNotice = document.querySelector('#dutyTitle')
    dutyNotice.innerText = ("已读取配置：" + config.year + "级" + config.class + "班" + config.teacher + "\n" + config.classroomName + "教室");
    // 欢迎语
    const welcome = document.querySelector('#welcome')
    welcome.innerText = "欢迎您！这里是" + config.classroomName + "！";
    if (config.countdown.inUse == 1) startCountdown(config.countdown.time, config.countdown.name);
    const dateToday = await dateConfirm();
    deployConfig(config, dateToday);
  } catch (error) {
    console.error('Error reading config:', error);
    throw error;
  }
}

function deployConfig(config, dateWeek) {
  const tableRow = document.querySelector('#dutyTitle');
  tableRow.innerHTML = '<th>周</th>';

  if (config.duty.dayLeader) {
    tableRow.innerHTML += '<th class="text-nowrap">值日班长</th>';
  }

  config.duty.subjectDetail.forEach(title => {
    tableRow.innerHTML += `<th class="text-nowrap">${title}</th>`;
  });

  const dutyNameRow = document.querySelector('#dutyName');
  const weekDays = ["一", "二", "三", "四", "五"];
  const chineseWeekDay = weekDays[dateWeek];

  dutyNameRow.innerHTML = '<th>' + chineseWeekDay + '</th>';

  config.duty.peopleDetail[dateWeek].forEach((name, index) => {
    const isClassLeader = index === 0 && config.duty.dayLeader === 1;
    const nameCell = isClassLeader ? `<th>${name}</th>` : `<td>${name}</td>`;
    dutyNameRow.innerHTML += nameCell;
  });
}

// 在线获取新配置
function getNewConfig(uuidRoute, version = 0) {
  return new Promise((resolve, reject) => {
    fetch('https://mirror.ghproxy.com/https://raw.githubusercontent.com/RainoutOvO/ClassWidget/rc/' + uuidRoute+"?"+Date.now())
      .then(response => response.json())
      .then(data => {
        if (data.version > version) {
          window.electronAPI.writeConfig(data);
          const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            }
          });
          Toast.fire({
            icon: "success",
            title: '新配置获取成功！',
            text: "配置信息" + data.year + "级" + data.class + "班" + data.teacher + "\n" + data.classroomName + "教室 v" + data.version
          });
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(error => {
        const Toast = Swal.mixin({
          toast: true,
          position: "middle",
          showConfirmButton: false,
          allowOutsideClick: false,
          // timer: 3000,
          // timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          }
        });
        Toast.fire({
          icon: "error",
          title: '新配置获取失败QAQ',
          text: '请检查班级ID是否正确，网络是否连通，然后重启软件重试'
        });
        resolve(false);
      });
  });
}


function infoReminder(infoTitle, infoText) {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });
  Toast.fire({
    icon: "info",
    title: infoTitle,
    text: infoText
  });
}

function onloadReminder(onloadTitle = "太棒啦，组件启动成功！", onloadText = "请不要频繁刷新古诗，以免受限") {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });
  Toast.fire({
    icon: "success",
    title: onloadTitle,
    text: onloadText
  });
}

// 方法：要求用户提供授权码
async function KeyCode() {
  const { value: keyCode } = await Swal.fire({
    allowOutsideClick: false,
    title: "嗨，别来无恙啊",
    input: "text",
    inputLabel: "班级ID",
    showCancelButton: false,
    inputValidator: (value) => {
      if (!value) {
        return "您必须输入班级ID才能继续。";
      }
    }
  });
  if (keyCode) {
    await getNewConfig(keyCode, 0);
    main();
  }
}

async function main() {
  try {
    await readConfig();
    onloadReminder();
    requestHitokoto();
  } catch (error) {
    console.error('Error in main function:', error);
    KeyCode();
  }
}

main();