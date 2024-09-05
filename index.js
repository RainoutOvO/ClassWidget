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

// 读取配置文件
async function readConfig(online = true) {
  try {
    const config = await window.electronAPI.readConfig();
    if (!config || Object.keys(config).length === 0) {
      throw new Error('Config file is missing or empty');
    }
    // 提示配置文件
    const hitokoto = document.querySelector('#hitokoto_text')
    hitokoto.innerText =("已读取配置："+config.year + "级" + config.class + "班" + config.teacher + "\n" + config.classroomName + "教室");
    // 欢迎语
    const welcome = document.querySelector('#welcome')
    welcome.innerText = "欢迎！这里是"+config.classroomName+"教室！";
    if (online && await getNewConfig(config.route, config.version)) {
      await readConfig();
      return;
    }
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
    fetch('https://rainoutovo.github.io/ClassWidget/' + uuidRoute)
      .then(response => response.json())
      .then(data => {
        if (data.version > version) {
          window.electronAPI.writeConfig(data);
          console.log('Write Config Response:', data);
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(error => {
        console.error('Error fetching new config:', error);
        reject(error);
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
    inputLabel: "班级授权码",
    showCancelButton: false,
    inputValidator: (value) => {
      if (!value) {
        return "您必须输入班级授权码才能继续。";
      }
    }
  });
  if (keyCode) {
    await getNewConfig(keyCode,0);
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