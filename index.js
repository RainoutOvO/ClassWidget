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


// 工作日判断
function isWorkday() {
  const notWorkdays = [6, 7]; // 周六和周日不是工作日
  const today = new Date().getDay();
  return !notWorkdays.includes(today);
}


// 日期确认
function dateConfirm() {
  const daysOfWeek = ["周一", "周二", "周三", "周四", "周五"];
  return new Promise((resolve, reject) => {
    if (!isWorkday()) {
      Swal.fire({
        title: "被调休到周几了呐？",
        input: "select",
        inputOptions: daysOfWeek,
        showCancelButton: false,
        confirmButtonText: "确定",
        allowOutsideClick: false,
        inputValidator: (value) => {
          if (!value) {
            return "你一定要选一个啊喂！";
          }
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const selectedDay = result.value;
          let dayNumber = daysOfWeek.indexOf(selectedDay) + 1;
          resolve(dayNumber);
        } else {
          reject("你必须要选一个啊喂！");
        }
      });
    } else {
      Swal.fire({
        title: "泥嚎\\(@^0^@)/ 今天有被调休嘛？",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "没有！冲冲冲！",
        cancelButtonText: "有的，呜呜呜",
        reverseButtons: true,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isDenied) {
          Swal.fire({
            title: "被调休到周几了呐？",
            input: "select",
            inputOptions: daysOfWeek,
            // inputPlaceholder: "你一定要选一个啊喂！",
            showCancelButton: false,
            confirmButtonText: "确定",
            allowOutsideClick: false,
            inputValidator: (value) => {
              if (!value) {
                return "你一定要选一个啊喂！";
              }
            },
          }).then((result) => {
            if (result.isConfirmed) {
              const selectedDay = result.value;
              let dayNumber = daysOfWeek.indexOf(selectedDay) + 1;
              resolve(dayNumber);
            } else {
              reject("你必须要选一个啊喂！");
            }
          });
        } else {
          const today = new Date().getDay();
          let dayNumber = today === 0 ? 7 : today;
          resolve(dayNumber);
        }
      });
    }
  });
}

// 读取配置文件
function readConfig(online = true) {
  window.electronAPI.readConfig().then(config => {
    // matrixConfig = JSON.parse(config);
    if (online) {
      if (getNewConfig(config.route, config.version) == true) {
        readConfig();
        return;
      }
    }
    dateConfirm();
    dateConfirm().then(dayNumber => {
      deployConfig(config, dayNumber);
    }).catch(error => {
      console.error(error);
    });
    infoReminder("已读取配置", config.year + "级" + config.class + "班" + config.teacher + "\n" + config.classroomName + "教室");
  });
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
  const chineseWeekDay = weekDays[dateWeek - 1];

  dutyNameRow.innerHTML = '<th>' + chineseWeekDay + '</th>';

  config.duty.peopleDetail[dateWeek - 1].forEach((name, index) => {
    const isClassLeader = index === 0 && config.duty.dayLeader === 1;
    const nameCell = isClassLeader ? `<th>${name}</th>` : `<td>${name}</td>`;
    dutyNameRow.innerHTML += nameCell;
  });
}

// 在线获取新配置
function getNewConfig(uuidRoute, version = 0) {
  let newUpdate = false; // 定义 newUpdate 变量
  fetch('https://rainoutovo.github.io/ClassWidget/' + uuidRoute)
    .then(response => {
      if (response.version > version) {
        window.electronAPI.writeConfig(data);
        console.log('Write Config Response:', response);
        newUpdate = true;
      }
    })
    .catch(console.error);
  return (newUpdate);
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

requestHitokoto();
readConfig();
onloadReminder();