export interface MeetingTemplate {
  name: string;
  category: string;
  transcript: string;
}

export const MEETING_TEMPLATES: MeetingTemplate[] = [
  {
    name: "中英夾雜跨境行銷會議",
    category: "行銷 & 營運",
    transcript: `時間：2026年5月10日 早上10:30
與會人員：Allen (Marketing Lead), Brenda (Designer), Chris (Product Manager EMEA)

Allen: 大家早，今天我們重點討論 Q3 launch campaign for our new features. Chris, can you give us a quick updates on product readiness?

Chris: Sure, Allen. The feature is 95% cooked, currently in final regression testing. We are on track for global deployment on June 15th. However, our translation files for localized versions are lagging behind. We need the translated copy by next Monday to meet the freeze date.

Allen: 收到了。Brenda, how is the creative asset progressing for English and Japanese markets?

Brenda: 視覺設計跟 Banner 差不多了，主要差日文翻譯的最終審查。我這邊日文素材需要一個 native speaker 幫忙看過。Allen, can we hire an external translator, or does our HQ team have budget for that?

Allen: Let me double check the budget. 我下午 3 點前確認，如果可以的話，立刻在 Upwork 找一個 Native Contractor。
Chris, what about the landing page specs? 

Chris: The developers need the exact layout copy and hero screenshots by Friday noon limit. Otherwise, they cannot finish the code deployment on time. Allen, do we have the localized localized strings ready?

Allen: 翻譯部分我今天晚上會拉一個 Google Sheet 一起編輯。
Brenda, 你週五早上前把設計好的 Hero screenshot 上傳到 Shared Drive，我再貼給 Chris。

Brenda: 沒問題，我明天下午就可以搞定。

Allen: 很好。另外，關於 Ads budget 投放比例，由於日本市場 LTV 較高，我們打算比原定計劃提高 20% budget，並減少 10% 歐洲部分的預算。Chris, do you see any issues there?

Chris: No objection from my side, the target CPI in Japan is actually lower lately. It's a wise move.

Allen: OK, summarize 今天的幾點事：
1. Allen 確認日文 Upwork 人力與預算（今天 3:00 PM 前）。
2. Allen 建立翻譯協作 Google Sheet（今天晚上前）。
3. Brenda 週五中午前提供 Hero Screenshots。
4. Chris 與開發團隊確認，要在下週一前把所有翻譯資源導入完畢。

大家有問題嗎？沒有的話解散，Thanks!`
  },
  {
    name: "軟體研發 Sprint 衝刺雙週會",
    category: "產品 & 工程",
    transcript: `專案名稱：極速雲端儲存平台 V2.4
主持人：Kevin (Product Owner)
出席：Sophia (QA), Leo (Frontend Developer), Max (Backend Lead)

Kevin: 大家早，我們開始本期 Sprint 15 的進度對齊。這一期我們的目標是改善 Large Files Updload Performance 與解決高流量下 Redis 快取擊穿的問題。

Leo: 前端部分，大檔案分割與 Socket 續傳的元件已經開發完了。目前在 Local 端測試上傳 10GB 的檔案都是穩定的。唯一的阻礙（Blocker）是目前 API 的 CORS 設定好像在 Staging 測試環境被擋了，Max 可以幫忙看一下嗎？

Max: 好的。我記得是在 Nginx 層設定有點被 Override，我今天下午 3 點前去更新 Kubernetes 的 ConfigMap 把這個 fix 掉。另外後端方面，Redis 緩存雪崩的防護機制已經加上互斥鎖（Mutex Lock）與隨機過期時間設定。我昨天配了 P99 壓測，QPS 可以順利跑到 12,000 以上，CPU 使用率穩定在 45% 左右。

Kevin: 太棒了！最大進展。Sophia，這期的 QA 進展如何？

Sophia: 自動化測試腳本跑過兩輪了，主要有三個 Bug：
1. 低網速 (3G) 條件下，大檔案重試會卡在 99% 的無窮迴圈（已跟 Leo 分享 Log）。
2. 黑暗模式（Dark Mode）下上傳成功彈窗的字體是白色看不清楚。
3. 行動裝置上有些按鈕沒反應。
這三個 bug 我已經在 Jira 開票了，目前 assign 給 Leo。

Leo: 好的，那 1 號跟 2 號 Bug 我今天下班前處理好，行動裝置那個按鈕事件是因為 pointer-events 的問題，我明天中午前修掉並送交 Re-test。

Kevin: Good. 本次 Sprint 還剩下三天，我們預計本週五下午 5:00 進行 Staging Demo。
後續待辦整理如下：
- Max：下午 3:00 前修復 Staging CORS API 設定。
- Leo：今日下班前修正 Bug #1, #2；明天中午前修正 Bug #3。
- Sophia：Leo 修復後在明日下午 5:00 前完成 bug 驗證（Re-test）。
- Kevin：週五上午準備 Staging Demo 的演示案例與測試帳號。

祝大家這期順利衝刺，謝謝！`
  },
  {
    name: "生技醫藥研發專案例會",
    category: "生技 & 醫療",
    transcript: `專案代號：BL-901 (新型高血壓受體阻滯劑調配研究)
日期：2026年5月15日
記錄人：Dr. Lin

今日主要針對 BL-901 的第三階段抗氧化細胞毒性（Cytotoxicity）分析結果進行對齊。

Dr. Wang (實驗室主任): Lin，請你先匯報一下上週 Cell Viability 的實驗數據。

Dr. Lin: 好的，王主任。上週我們使用 H9c2 心肌細胞進行了 BL-901 的五種不同濃度梯度（10μM 到 200μM）的 24小時與 48小時暴露測試。
數據顯示，在 100μM 以下，細胞存活率均維持在 92% 以上。然而，當濃度提高到 150μM 時，48小時存活率顯著下降至 74% (p < 0.05)。這表明其安全窗口上限可能落在 120μM 附近。

Dr. Wang: 74% 的存活率有點偏低，這樣在後續的動物體內毒理評估上會有風險。我們必須調整助溶劑或添加中和載體（例如聚乙二醇 PEG-400 配方）。Lin，你能不能在下週三前調配出三種含有不同比例 PEG-400 的新配方並重新進行 H9c2 存活率分析？

Dr. Lin: 可以的。但我需要購買最新的 PEG-400 試劑，我們實驗室庫存快不夠了。

Dr. Chang (採購專家): 採購 PEG-400 我可以處理，請 Lin 今天中午前將試劑規格與採購單開出來。我最快能在本週五下午前提貨到實驗室。

Dr. Wang: 很好。另外，關於這週要向衛福部遞交的 IND (新藥臨床試驗申請) 前導報告草案，Dr. Chang 你的進度如何？

Dr. Chang: 報告草案的毒理與藥理章節已經撰寫了 80%，化學與製造管制 (CMC) 還需要 Lin 的實驗室配方細節。

Dr. Lin: 這週五前，我會把 CMC 章節所需的化合物質譜圖、純度鑑定報告與配方說明書彙整好交給 Chang。

Dr. Wang: 好的，總結如下：
- Dr. Lin：今日中午前提交 PEG-450 採購單規格；週五前提交 CMC 毒理與藥物分析圖表給 Dr. Chang；下週三前完成 PEG配方細胞存活率驗證。
- Dr. Chang：週五前提貨試劑；下週一下午 5:00 前彙整完成 IND 前導報告草案，交由王主任審閱。`
  }
];
