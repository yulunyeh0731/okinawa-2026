/* 沖繩 2026 家族旅行：行程資料
   要改行程只改這個檔案。
   stop 類型：fixed（時間卡死，紅菱形）、stop（一般景點）、drive（車程）、fork（二選一）
   closed：公休的星期幾（0=週日 … 6=週六），當天剛好公休會自動標紅。
   車程都是粗估，實際以導航為準。 */

const SOURCE_SHEET = "https://docs.google.com/spreadsheets/d/1zi6GL0y19laubnoVAIIv4W4oAD1ysJLBizAOx82qRWQ/edit";

const LODGES = {
  almont: { name: "Almont Hotel Naha Omoromachi", jp: "アルモントホテル那覇おもろまち", map: "アルモントホテル那覇おもろまち", addr: "沖縄県那覇市おもろまち4-3-8",
            note: "14:00 起入住、11:00 前退房。おもろまち站走路約 4 分。過午夜才到的話要先聯絡飯店。" },
  coral:  { name: "CORAL ISLAND 珊瑚島", jp: "名護市大浦", map: "CORAL ISLAND 名護市大浦", addr: "沖縄県名護市大浦27-5",
            note: "16:00 起入住（最晚 21:00）、11:00 前退房。沒有櫃檯，入住方式（門鎖、鑰匙）看訂房信。每棟前面可停 2 台車。附近餐廳很少，晚餐先想好。" },
  livele: { name: "Livele Garden Villa UZA くんじゅん C 棟", jp: "読谷村宇座", map: "Livele Garden Villa UZA",
            note: "15:00 起入住、10:00 前退房。在殘波岬附近。地址和入住方式看訂房信。" }
};

const DAYS = [
  {
    date: "2026-11-18", wx: { lat: 26.21, lon: 127.68, at: "那霸" }, d: 18, wk: "週三", route: "桃園　往　那霸",
    theme: { w1:"#8E9CC4", w2:"#4A5C96", w3:"#1E2A55", flower:"#E86A7E", te:"#C9CEDD", tf:"#E6E9F2", tp:"#B9C0D6", bg:"#F1F2F7", chip:"#E1E4EF", line:"#B6BEDA" },
    facts: [ {t:"晚上落地"}, {t:"虎航晚班常延誤，入住可能過 22:00", warn:true} ],
    items: [
      { type:"fixed", time:"16:00", title:"到桃園機場第一航廈", note:"台灣虎航在第一航廈。" },
      { type:"fixed", time:"18:20", title:"台灣虎航 IT232　桃園 → 那霸", note:"預計 20:40 抵達那霸（日本時間）。" },
      { type:"drive", text:"坐單軌電車（ゆいレール）到おもろまち站，約 23 分。末班車 23:30，趕不上就搭計程車（6 人要 2 台）" },
      { type:"stop", title:"Almont Hotel 入住", sub:"アルモントホテル那覇おもろまち　おもろまち站走路約 4 分", map:"アルモントホテル那覇おもろまち" }
    ],
    lodge: "almont"
  },
  {
    date: "2026-11-19", wx: { lat: 26.59, lon: 127.98, at: "名護" }, d: 19, wk: "週四", route: "那霸　往　古宇利・名護",
    theme: { w1:"#8FE0C8", w2:"#2BB59A", w3:"#157A7A", flower:"#D2384E", te:"#BFE6D8", tf:"#E0F3EC", tp:"#A8DCC9", bg:"#F1F6F4", chip:"#DDEFEA", line:"#9FD3CC" },
    facts: [ {t:"日落約 17:39"}, {t:"今天開最遠，約 1.5 小時到古宇利"} ],
    items: [
      { type:"stop", title:"飯店早餐" },
      { type:"fixed", time:"11:00", title:"退房＋ORIX 取車", sub:"オリックスレンタカー　おもろまち駅前店（櫃檯在站旁的 DFS 裡）", map:"オリックスレンタカー おもろまち駅前店",
        note:"兩台車：倫開 EA 級（油電車，放大部分行李）、瑄開 RD 級（X-TRAIL 級，坐 4 人）。都有 ETC 卡。" },
      { type:"drive", text:"開車約 1 小時 30 分（走高速）" },
      { type:"stop", title:"古宇利島", mapcode:"485 662 831*22", tel:"0980-56-1616", map:"古宇利島",
        list:["古宇利塔　10:00–18:00（17:30 最後入場）　門票 1,000 円","トケイ浜：北邊的祕境海灘，有奇岩","心形岩（ハートロック）"],
        food:[
          { n:"RICE BOWL FACTORY", h:"11:30–19:30", veg:"蔬食友善" },
          { n:"辣木之木 cafe & shop", h:"8:30–16:00", veg:"蔬食友善", note:"日文：モリンガの木" },
          { n:"古宇利蝦蝦飯", h:"11:00–15:00 L.O.", note:"有蔬菜濃湯，周邊商品很可愛" }
        ] },
      { type:"drive", text:"開車約 40 分" },
      { type:"fixed", time:"16:00 起", title:"CORAL ISLAND 入住", sub:"最晚 21:00 前入住", map:LODGES.coral.map }
    ],
    backups: [
      { n:"名護鳳梨公園", jp:"ナゴパイナップルパーク", h:"10:00–18:00（17:30 最後入園）　門票 1,500 円", note:"下雨時代替古宇利。坐有屋頂的自動小車逛鳳梨園，再到室內試吃、買伴手禮，約 1 到 2 小時。在名護市區，往住宿的路上。", tags:["雨天"], addr:"沖縄県名護市為又1195", map:"ナゴパイナップルパーク" },
      { n:"名護永旺超市（AEON）", jp:"イオン名護店", h:"食品賣場 8:00–23:00", note:"CORAL ISLAND 附近幾乎沒有餐廳和商店。從古宇利過去會經過名護市區，可以在這裡買晚餐和隔天早餐。", tags:["採買"], addr:"沖縄県名護市字名護見取川原4472", map:"イオン名護店" }
    ],
    lodge: "coral"
  },
  {
    date: "2026-11-20", wx: { lat: 26.59, lon: 127.98, at: "名護大浦" }, d: 20, wk: "週五", route: "PARTY DAY",
    theme: { w1:"#9AD7E6", w2:"#3FA7C9", w3:"#1F6F99", flower:"#E86A7E", te:"#C3E1EA", tf:"#E2F1F5", tp:"#ADD6E2", bg:"#F1F5F7", chip:"#DCEBF1", line:"#A6D2E1" },
    facts: [ {t:"日落約 17:38"}, {t:"杰和凡宜的 party"} ],
    items: [
      { type:"stop", title:"整天在 CORAL ISLAND", note:"杰和凡宜的 party。" }
    ],
    backups: [
      { n:"大浦的在地蔬菜定食", jp:"あたいぐゎキッチン（わんさか大浦パーク 裡面）", h:"11:00–14:30（週末到 15:00），只有午餐", note:"離 CORAL ISLAND 很近。在大浦的農產直售所裡，用當地蔬菜做的定食，順便可以買菜和水果。第 2、4 個週三公休。", tags:["蔬食友善","午餐"], tel:"0980-51-9446", addr:"沖縄県名護市大浦465-7", map:"わんさか大浦パーク" }
    ],
    lodge: "coral"
  },
  {
    date: "2026-11-21", wx: { lat: 26.40, lon: 127.73, at: "讀谷" }, d: 21, wk: "週六", route: "名護大浦　往　讀谷宇座",
    theme: { w1:"#F3C089", w2:"#E58A5C", w3:"#2E5E80", flower:"#F2B33D", te:"#F0DCC8", tf:"#F8EEE4", tp:"#EBCDB3", bg:"#F7F3EF", chip:"#F1E3D6", line:"#E7C3A5" },
    facts: [ {t:"日落約 17:38"}, {t:"日本三連休第一天，58 號會塞", warn:true} ],
    items: [
      { type:"fixed", time:"11:00 前", title:"CORAL ISLAND 退房" },
      { type:"drive", text:"開車約 40 分" },
      { type:"stop", title:"Cafe 天の船", sub:"本部的森林咖啡　10:30–14:30 L.O.", closed:[1,5], closedText:"週一、週五公休",
        warn:"要預約，名額一開就滿。沒訂到就直接去陶器之里吃。", mapcode:"206 862 200", tel:"070-3803-5308", map:"Cafe 天の船 本部町" },
      { type:"drive", text:"開車約 1 小時" },
      { type:"stop", title:"やちむんの里（陶器之里）", addr:"沖縄県中頭郡読谷村座喜味2653-1", map:"やちむんの里 読谷", note:"入口附近有免費停車場。里內是小坡道，穿好走的鞋。",
        food:[ { n:"Clay Cafe & Gallery", h:"週六 9:00–16:00", closed:[0,4], closedText:"週四、週日公休", link:"https://www.claycoffeeandgallery.com/portfolio" } ] },
      { type:"drive", text:"開車約 10 分" },
      { type:"fixed", time:"15:00 起", title:"Livele Garden Villa UZA 入住", sub:"くんじゅん C 棟", map:LODGES.livele.map },
      { type:"fork", q:"下午到傍晚，兩邊方向相反，選一個", opts:[
        { k:"甲", title:"北谷", text:"北谷町立博物館 10:00–17:00（特別展「北谷の縄文」，11/21–22 有繩文節活動，內容未確認）→ 北谷海邊看夕陽 → 晚餐暖暮拉麵", drive:"從住的地方開車約 40 分",
          acts:[ {tel:"098-923-0300"}, {addr:"沖縄県中頭郡北谷町伊平1-11-1", label:"博物館地址"}, {map:"北谷町立博物館", label:"博物館地圖"}, {addr:"沖縄県中頭郡北谷町宮城2-123", label:"暖暮地址"}, {map:"ラーメン暖暮 北谷砂辺店", label:"暖暮地圖"}, {link:"https://love.chatan.jp/zh-hant/thechatanbrand/#chatanbrandsec02", label:"北谷介紹"} ],
          food:[ { n:"暖暮拉麵 北谷砂邊店", h:"11:00–23:00", note:"日文：ラーメン暖暮 北谷砂辺店" } ] },
        { k:"乙", title:"萬座毛", text:"萬座毛看夕陽，17:00 前要到（步道門票 100 円，開到 19:00）→ 晚餐花笠食堂", drive:"從住的地方開車約 30 分",
          acts:[ {mapcode:"206 312 038*55"}, {tel:"098-966-8080"}, {map:"万座毛"}, {addr:"沖縄県中頭郡読谷村宇座657-1", label:"花笠地址"} ],
          food:[ { n:"花笠食堂", h:"晚上時間未確認", closed:[4], closedText:"週四公休", note:"在殘波的御菓子御殿 1 樓。晚上可能很早收，先打電話：098-958-7333" } ] }
      ]}
    ],
    backups: [
      { n:"陶藝工房咖啡 Gunjo", jp:"やちむんカフェ ぐんじょう", h:"週六 10:00–18:00（餐點 11:00–17:30）", closed:[3], note:"天の船沒訂到時的午餐。陶藝工房附設的咖啡店，離陶器之里很近，招牌是柴燒石窯披薩，注重蔬菜料理。不能訂位，賣完就收。週三公休。", tags:["蔬食友善","午餐"], tel:"098-927-9167", addr:"沖縄県中頭郡読谷村座喜味2898-21", map:"やちむんカフェ ぐんじょう" },
      { n:"石窯披薩小酒館 Maruki", jp:"読谷 石窯ピザ酒場まるき", h:"17:30–22:30（週日、週二、假日公休）", closed:[0,2], note:"晚餐。離住的地方開車約 5 分，這一帶餐廳少，這家評價很高。可以訂位，6 個人建議先打電話。", tags:["晚餐"], tel:"098-923-2826", addr:"沖縄県中頭郡読谷村瀬名波230", map:"石窯ピザ酒場まるき 読谷" },
      { n:"殘波岬看夕陽", jp:"残波岬", note:"甲、乙都來不及的話：離住的地方約 5 分，有燈塔和斷崖，是本島夕陽最晚落下的地方。", tags:["夕陽"], map:"残波岬" }
    ],
    lodge: "livele"
  },
  {
    date: "2026-11-22", wx: { lat: 26.40, lon: 127.73, at: "讀谷" }, d: 22, wk: "週日", route: "讀谷　往　勝連城",
    theme: { w1:"#B6E3F0", w2:"#4BB3D6", w3:"#1C6E9E", flower:"#D2384E", te:"#C6E2EE", tf:"#E4F2F8", tp:"#B0D7E8", bg:"#F1F6F9", chip:"#DDEEF5", line:"#A9D3E6" },
    facts: [ {t:"日落約 17:37"}, {t:"三連休第二天，晚餐記得先訂", warn:true} ],
    items: [
      { type:"stop", title:"BANTA CAFE by 星野リゾート", sub:"海景咖啡　週末和假日 8:00 開", tel:"098-921-6810", addr:"沖縄県中頭郡読谷村儀間560", map:"バンタカフェ 読谷", note:"在這裡消費，停車場免費 1 小時。" },
      { type:"drive", text:"開車約 20 分" },
      { type:"stop", title:"琉球村", sub:"9:30–17:00　門票 2,000 円（用 Agoda 買比較便宜）", mapcode:"206 033 096*41", map:"琉球村 恩納村",
        note:"琉球王國主題園區：表演、百年古宅、彩繪風獅爺、DIY、換裝。", link:"https://okinawa.letsgojp.com/archives/884774/" },
      { type:"drive", text:"開車約 50 分" },
      { type:"stop", title:"勝連城跡", sub:"世界遺產　9:00–18:00（17:30 停止售票）　門票 600 円", note:"從あまわりパーク買票、停車（免費）。到城頂要爬石階，穿好走的鞋。", mapcode:"499 570 171*28", tel:"098-978-7373", map:"勝連城跡" },
      { type:"drive", text:"回住的地方約 50 分" },
      { type:"stop", title:"晚餐：還沒決定", note:"週日加連假，4 人以上建議先訂位。" }
    ],
    backups: [
      { n:"體驗王國 Murasaki Mura", jp:"体験王国むら咲むら", h:"9:00–18:00（體驗到 17:00）", note:"下雨時的備案。重現琉球街景的園區，有很多室內手作體驗（陶藝、玻璃、染布等）。離住的地方很近。", tags:["雨天"], tel:"098-958-1111", addr:"沖縄県中頭郡読谷村高志保1020-1", map:"体験王国むら咲むら" },
      { n:"日航 Alivila 飯店的自助餐", jp:"ホテル日航アリビラ「ブラッスリー ベルデマール」", h:"晚餐 17:30–21:30（21:00 最後入場）", note:"晚餐。飯店自助餐，菜色多，吃素的人也有得選，連假也比較容納得下 6 個人。在早上 BANTA CAFE 附近。價位較高，先打電話問價錢和訂位。", tags:["晚餐"], tel:"098-982-9111", addr:"沖縄県中頭郡読谷村儀間600", map:"ホテル日航アリビラ" },
      { n:"花笠食堂", jp:"花笠（御菓子御殿 読谷本店 裡面）", note:"晚餐（前一天沒去的話）。沖繩家常料理，在住的地方附近。週日有開（週四公休），晚上開到幾點不確定，先打電話。", tags:["晚餐"], tel:"098-958-7333", addr:"沖縄県中頭郡読谷村宇座657-1", map:"御菓子御殿 読谷本店" },
      { n:"殘波岬看夕陽", jp:"残波岬", note:"從勝連城回來如果趕得上：離住的地方約 5 分，有燈塔和斷崖。", tags:["夕陽"], map:"残波岬" }
    ],
    lodge: "livele"
  },
  {
    date: "2026-11-23", wx: { lat: 26.17, lon: 127.75, at: "南部" }, d: 23, wk: "週一", route: "讀谷　往　南城",
    theme: { w1:"#C8B6E2", w2:"#7E68B5", w3:"#2C2F6B", flower:"#F4A9BB", te:"#D9D0EA", tf:"#EEE9F6", tp:"#CBBFE2", bg:"#F4F2F8", chip:"#E6E1F0", line:"#C4B9DE" },
    facts: [ {t:"日本國定假日，三連休最後一天", warn:true}, {t:"日落約 17:37"}, {t:"還車前記得加滿油"} ],
    items: [
      { type:"fixed", time:"10:00 前", title:"Livele Garden Villa 退房" },
      { type:"drive", text:"開車約 40 分（走高速）" },
      { type:"stop", title:"Ploughman's Lunch Bakery　早餐", sub:"9:00–16:00　可以訂位　不能刷卡", tel:"098-979-9097", addr:"沖縄県中頭郡北中城村安谷屋927-2", map:"Ploughman's Lunch Bakery", link:"https://ploughmans.net/",
        note:"停車場在坡下，走坡道和樓梯約 2 分。吃素可點酪梨三明治、湯。" },
      { type:"drive", text:"開車約 40 分" },
      { type:"stop", title:"南城美術館", sub:"11:00–16:00　門票 300 円", tel:"098-975-7616", addr:"沖縄県南城市知念安座真865", map:"南城美術館", link:"https://nanjoart.com/",
        note:"森林裡的小美術館，有海景露台。" },
      { type:"drive", text:"開車約 5 分" },
      { type:"stop", title:"南城市地域物產館＋知念岬", sub:"伴手禮・看海　停車免費", tel:"098-949-1667", addr:"沖縄県南城市知念久手堅539", map:"南城市地域物産館",
        note:"兩個地方共用停車場，走到岬角約 10 分。" },
      { type:"drive", text:"開車約 40 分（14:15 前從知念出發）" },
      { type:"stop", title:"てぃーち　下午茶", sub:"假日最後點餐 15:00", mapcode:"232 545 238*00", tel:"098-856-8558", addr:"沖縄県豊見城市翁長664-2", map:"てぃーち 豊見城", link:"https://www.instagram.com/teech_cafe",
        note:"14:15 還沒離開知念就跳過，直接去 iias。" },
      { type:"drive", text:"開車約 15 分" },
      { type:"stop", title:"iias 沖繩豐崎", sub:"還車前逛逛　停車免費", addr:"沖縄県豊見城市豊崎3-35", map:"イーアス沖縄豊崎",
        note:"約 17:00 離開去加油。" },
      { type:"fixed", time:"17:30 左右", title:"ORIX 還車（那覇空港店）", sub:"外語櫃檯", tel:"098-851-0543", addr:"沖縄県豊見城市豊崎1-1174", map:"オリックスレンタカー 那覇空港店",
        note:"還車前兩台都加滿油。接駁車到機場約 20 分。" },
      { type:"fixed", time:"21:30", title:"台灣虎航 IT233　那霸 → 桃園", note:"預計 22:05 抵達桃園（台灣時間）。" }
    ],
    backups: [
      { n:"PINE LEAVES（早餐備案）", jp:"PINE LEAVES（ローヤルホテル 1F）", h:"7:00–16:00", note:"Ploughman's 沒開時。讀谷楚邊，有停車場，吃素可點法拉費盤。", tags:["早餐","蔬食友善"], tel:"098-956-3321", addr:"沖縄県中頭郡読谷村楚辺1315", map:"PINE LEAVES 読谷" },
      { n:"Morning Works（早餐備案）", jp:"モーニングワークス", h:"7:00–15:30", note:"嘉手納，順路，有停車場。熱門，可能要等。", tags:["早餐","蔬食友善"], tel:"098-988-5860", addr:"沖縄県中頭郡嘉手納町水釜155-1", map:"Morning Works 嘉手納" },
      { n:"齋場御嶽（只能走到入口）", jp:"斎場御嶽", note:"11/2～1/5 施工，只能走到入口「御門口」，入場免費，限定發放「巡禮紀念證」。", tags:["世界遺產"], tel:"098-949-1899", map:"斎場御嶽", link:"https://sefa.okinawa/news/topics/713/" },
      { n:"奧武島", jp:"奥武島（南城市）", note:"不去 iias 時，小漁村買現炸天婦羅。", tags:["順路"], map:"奥武島 南城市" },
      { n:"玉泉洞（沖繩世界）", jp:"おきなわワールド 玉泉洞", h:"9:00–17:30（最後入園 16:00）　門票 2,000 円", note:"下雨時的室內備案，洞內有階梯。", tags:["雨天"], tel:"098-949-7421", addr:"沖縄県南城市玉城前川1336", map:"おきなわワールド" }
    ],
    lodge: null
  }
];
