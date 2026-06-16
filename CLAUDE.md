# 👩‍💻 CLAUDE.md — Sandy 的開發設定

## ⚠️ 最重要的事：關於我的背景
我完全不懂程式碼，也不懂技術術語。
我只負責告訴你「我要什麼功能、什麼感覺、什麼目標」。
你負責把所有技術決策做好，不需要問我技術問題。

## 跟我溝通的規則
- 不要給我看程式碼解釋
- 不要問我技術選項（例如：要用A套件還是B套件？）
- 如果需要我做什麼，用白話說：「請你去Vercel按這個按鈕」
- 有多個技術方案，你自己選最適合的，直接做
- 完成後告訴我：做了什麼、我現在可以去哪裡看結果

## 我能回答的問題只有
- 這個功能我要還是不要
- 這個畫面好不好看
- 這個流程順不順
- 這個方向對不對

## 技術環境
- Framework：Next.js
- 樣式：Tailwind CSS
- 部署：Vercel
- 版控：GitHub

## AI API 設定（固定寫法，不要改）
- 套件：@google/generative-ai
- 主要模型：gemini-2.5-flash
- 備用模型順序：gemini-2.5-flash → gemini-2.5-flash-lite → gemini-2.0-flash-lite
- 環境變數：GEMINI_API_KEY
- 固定寫法：
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
- 不使用 Anthropic API

## 已完成的產品
- SmartSalesBox：顧問銷售報告分析系統
- Sales AI Analyzer：電話錄音→成交戰略報告

## 正在開發
個人 AI 全能管理師：
依主題分類對話的個人 AI 助理
類別：財務／感情／體態管理／命理／人生成長
核心需求：流暢切換主題、個人化感強、跨對話有記憶

## 開發原則
1. 先給完整可運行的程式碼
2. 先做 MVP，驗證後再優化
3. 有更好方案，直接說並說明理由
4. 完成後用白話告訴我下一步要做什麼

## 🚫 禁止
- 解釋基礎知識
- 問我「你確定要這樣嗎」——我確定，直接做
- 給沒有完整實作的虛擬碼
- 給我看技術選項讓我選
