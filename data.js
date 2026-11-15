/* 沖繩 2026 家族旅行：行程資料
   要改行程只改這個檔案。
   stop 類型：fixed（時間卡死，紅菱形）、stop（一般景點）、drive（車程）、fork（二選一）
   closed：公休的星期幾（0=週日 … 6=週六），當天剛好公休會自動標紅。
   車程都是粗估，實際以導航為準。 */

const SOURCE_SHEET = "https://docs.google.com/spreadsheets/d/1zi6GL0y19laubnoVAIIv4W4oAD1ysJLBizAOx82qRWQ/edit";

const LODGES = {
  almont: { name: "Almont Hotel Naha Omoromachi", jp: "アルモントホテル那覇おもろまち", map: "アルモントホテル那覇おもろまち",
            note: "14:00 起入住、11:00 前退房。單軌電車おもろまち站附近。" },
  coral:  { name: "CORAL ISLAND 珊瑚島", jp: "名護市大浦", map: "CORAL ISLAND 名護市大浦",
            note: "16:00 起入住（最晚 21:00）、11:00 前退房。沒有櫃檯，每棟前面可停 2 台車。附近餐廳很少，晚餐先想好。" },
  livele: { name: "Livele Garden Villa UZA くんじゅん C 棟", jp: "読谷村宇座", map: "Livele Garden Villa UZA",
            note: "15:00 起入住、10:00 前退房。在殘波岬附近。" }
};

const DAYS = [
  {
    date: "2026-11-18", d: 18, wk: "週三", route: "桃園　往　那霸",
    theme: { w1:"#8E9CC4", w2:"#4A5C96", w3:"#1E2A55", flower:"#E86A7E", te:"#C9CEDD", tf:"#E6E9F2", tp:"#B9C0D6", bg:"#F1F2F7", chip:"#E1E4EF", line:"#B6BEDA" },
    facts: [ {t:"晚上落地"}, {t:"虎航晚班常延誤，入住可能過 22:00", warn:true} ],
    items: [
      { type:"fixed", time:"16:00", title:"到桃園機場第一航廈", note:"台灣虎航在第一航廈。" },
      { type:"fixed", time:"18:20", title:"台灣虎航 IT232　桃園 → 那霸", note:"預計 20:40 抵達那霸（日本時間）。" },
      { type:"drive", text:"坐單軌電車（ゆいレール）到おもろまち站" },
      { type:"stop", title:"Almont Hotel 入住", sub:"アルモントホテル那覇おもろまち", map:"アルモントホテル那覇おもろまち" }
    ],
    lodge: "almont"
  },
  {
    date: "2026-11-19", d: 19, wk: "週四", route: "那霸　往　古宇利・名護",
    theme: { w1:"#8FE0C8", w2:"#2BB59A", w3:"#157A7A", flower:"#D2384E", te:"#BFE6D8", tf:"#E0F3EC", tp:"#A8DCC9", bg:"#F1F6F4", chip:"#DDEFEA", line:"#9FD3CC" },
    facts: [ {t:"日落約 17:39"}, {t:"今天開最遠，約 1.5 小時到古宇利"} ],
    items: [
      { type:"stop", title:"飯店早餐" },
      { type:"fixed", time:"11:00", title:"退房＋ORIX 取車", sub:"オリックスレンタカー　おもろまち駅前店", map:"オリックスレンタカー おもろまち駅前店",
        note:"兩台車：倫開 EA 級（油電車，放大部分行李）、瑄開 RD 級（X-TRAIL 級，坐 4 人）。都有 ETC 卡。" },
      { type:"drive", text:"開車約 1 小時 30 分（走高速）" },
      { type:"stop", title:"古宇利島", mapcode:"485 662 831*22", tel:"0980-56-1616", map:"古宇利島",
        list:["古宇利塔　10:00–18:00（17:30 最後入場）　門票 1,000 円","トケイ浜：北邊的祕境海灘，有奇岩","心形岩（ハートロック）"],
        food:[
          { n:"RICE BOWL FACTORY", h:"11:30–19:30", veg:"蔬食友善" },
          { n:"モリンガの木 cafe & shop", h:"8:30–16:00", veg:"蔬食友善" },
          { n:"古宇利蝦蝦飯", h:"11:00–15:00 L.O.", note:"有蔬菜濃湯，周邊商品很可愛" }
        ] },
      { type:"drive", text:"開車約 40 分" },
      { type:"fixed", time:"16:00 起", title:"CORAL ISLAND 入住", sub:"最晚 21:00 前入住", map:LODGES.coral.map }
    ],
    lodge: "coral"
  },
  {
    date: "2026-11-20", d: 20, wk: "週五", route: "PARTY DAY",
    theme: { w1:"#9AD7E6", w2:"#3FA7C9", w3:"#1F6F99", flower:"#E86A7E", te:"#C3E1EA", tf:"#E2F1F5", tp:"#ADD6E2", bg:"#F1F5F7", chip:"#DCEBF1", line:"#A6D2E1" },
    facts: [ {t:"日落約 17:38"}, {t:"杰和凡宜的 party"} ],
    items: [
      { type:"stop", title:"整天在 CORAL ISLAND", note:"杰和凡宜的 party。" }
    ],
    lodge: "coral"
  },
  {
    date: "2026-11-21", d: 21, wk: "週六", route: "名護大浦　往　讀谷宇座",
    theme: { w1:"#F3C089", w2:"#E58A5C", w3:"#2E5E80", flower:"#F2B33D", te:"#F0DCC8", tf:"#F8EEE4", tp:"#EBCDB3", bg:"#F7F3EF", chip:"#F1E3D6", line:"#E7C3A5" },
    facts: [ {t:"日落約 17:38"}, {t:"日本三連休第一天，58 號會塞", warn:true} ],
    items: [
      { type:"fixed", time:"11:00 前", title:"CORAL ISLAND 退房" },
      { type:"drive", text:"開車約 40 分" },
      { type:"stop", title:"Cafe 天の船", sub:"本部的森林咖啡　10:30–14:30 L.O.", closed:[1,5], closedText:"週一、週五公休",
        warn:"要預約，名額一開就滿。沒訂到就直接去陶器之里吃。", mapcode:"206 862 200", tel:"070-3803-5308", map:"Cafe 天の船 本部町" },
      { type:"drive", text:"開車約 1 小時" },
      { type:"stop", title:"やちむんの里（陶器之里）", map:"やちむんの里 読谷",
        food:[ { n:"Clay Cafe & Gallery", h:"週六 9:00–16:00", closed:[0,4], closedText:"週四、週日公休", link:"https://www.claycoffeeandgallery.com/portfolio" } ] },
      { type:"drive", text:"開車約 10 分" },
      { type:"fixed", time:"15:00 起", title:"Livele Garden Villa UZA 入住", sub:"くんじゅん C 棟", map:LODGES.livele.map },
      { type:"fork", q:"下午到傍晚，兩邊方向相反，選一個", opts:[
        { k:"甲", title:"北谷", text:"北谷町立博物館 10:00–17:00（特別展「北谷の縄文」，11/21–22 有繩文節活動，內容未確認）→ 北谷海邊看夕陽 → 晚餐暖暮拉麵", drive:"從住的地方開車約 40 分",
          acts:[ {map:"北谷町立博物館", label:"博物館地圖"}, {map:"ラーメン暖暮 北谷砂辺店", label:"暖暮地圖"}, {link:"https://love.chatan.jp/zh-hant/thechatanbrand/#chatanbrandsec02", label:"北谷介紹"} ],
          food:[ { n:"ラーメン暖暮 北谷砂辺店", h:"11:00–23:00" } ] },
        { k:"乙", title:"萬座毛", text:"萬座毛看夕陽，17:00 前要到（步道門票 100 円，開到 19:00）→ 晚餐花笠食堂", drive:"從住的地方開車約 30 分",
          acts:[ {mapcode:"206 312 038*55"}, {tel:"098-966-8080"}, {map:"万座毛"} ],
          food:[ { n:"花笠食堂", h:"晚上時間未確認", closed:[4], closedText:"週四公休", note:"在殘波的御菓子御殿 1 樓。晚上可能很早收，先打電話：098-958-7333" } ] }
      ]}
    ],
    lodge: "livele"
  },
  {
    date: "2026-11-22", d: 22, wk: "週日", route: "讀谷　往　勝連城",
    theme: { w1:"#B6E3F0", w2:"#4BB3D6", w3:"#1C6E9E", flower:"#D2384E", te:"#C6E2EE", tf:"#E4F2F8", tp:"#B0D7E8", bg:"#F1F6F9", chip:"#DDEEF5", line:"#A9D3E6" },
    facts: [ {t:"日落約 17:37"}, {t:"三連休第二天，晚餐記得先訂", warn:true} ],
    items: [
      { type:"stop", title:"BANTA CAFE by 星野リゾート", sub:"海景咖啡　8:00–17:30", map:"バンタカフェ 読谷" },
      { type:"drive", text:"開車約 20 分" },
      { type:"stop", title:"琉球村", sub:"9:30–17:00　門票 2,000 円（用 Agoda 買比較便宜）", mapcode:"206 033 096*41", map:"琉球村 恩納村",
        note:"琉球王國主題園區：表演、百年古宅、彩繪風獅爺、DIY、換裝。", link:"https://okinawa.letsgojp.com/archives/884774/" },
      { type:"drive", text:"開車約 50 分" },
      { type:"stop", title:"勝連城跡", sub:"世界遺產，城牆是相方積み的多角形石頭", mapcode:"499 570 171*28", tel:"098-978-7373", map:"勝連城跡" },
      { type:"drive", text:"回住的地方約 50 分" },
      { type:"stop", title:"晚餐：還沒決定", note:"週日加連假，4 人以上建議先訂位。" }
    ],
    lodge: "livele"
  },
  {
    date: "2026-11-23", d: 23, wk: "週一", route: "讀谷　往　那霸機場",
    theme: { w1:"#C8B6E2", w2:"#7E68B5", w3:"#2C2F6B", flower:"#F4A9BB", te:"#D9D0EA", tf:"#EEE9F6", tp:"#CBBFE2", bg:"#F4F2F8", chip:"#E6E1F0", line:"#C4B9DE" },
    facts: [ {t:"日本國定假日（勤勞感謝日）", warn:true}, {t:"還車前記得加滿油"} ],
    pending: true,
    items: [
      { type:"fixed", time:"10:00 前", title:"Livele Garden Villa 退房" },
      { type:"stop", title:"行程還在排", note:"目前表上的候選：",
        food:[
          { n:"てぃーち", h:"11:00–15:00 L.O.", note:"沖繩麵＋芒果甜點，在豐見城，離還車點很近。週一可能公休，出發前看 IG 確認。098-856-8558", link:"https://www.instagram.com/teech_cafe" },
          { n:"海をのむ", note:"沖繩麵，在うるま", h:"11:00–15:00", closed:[2,3,4], closedText:"只開週五到週一", link:"https://www.instagram.com/umi_wo_nomu/" },
          { n:"ASMUI 大石林山", h:"16:00 停止入場", note:"本島最北，9:30–17:30。從讀谷單程約 2 小時。門票 2,500 円", link:"https://asmui.jp" }
        ] },
      { type:"fixed", time:"19:00 前", title:"ORIX 還車（那覇空港店）", sub:"豊見城市豊崎 1-1174　外語櫃檯", tel:"098-851-0543", map:"オリックスレンタカー 那覇空港店",
        note:"表上預計 18:00 還。還完坐接駁車到機場，約 20 分。" },
      { type:"fixed", time:"21:30", title:"台灣虎航 IT233　那霸 → 桃園", note:"預計 22:05 抵達桃園（台灣時間）。" }
    ],
    lodge: null
  }
];
