
import { pipeline, env } from
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

// ใช้โมเดลจากแหล่งเผยแพร่ ไม่ใช้ AI API
env.allowLocalModels = false;

const MODEL = "onnx-community/SmolLM2-360M-ONNX";
let generator = null;
let loading = null;

// สร้างหน้าจอ AI เพิ่มโดยไม่แก้ระบบเดิม
const card = document.createElement("section");
card.className = "card";
card.innerHTML = `
  <h2>Small AI — ผู้ช่วยวิเคราะห์รายการค้า</h2>
  <p class="note">
    AI ทดลองทำงานในเบราว์เซอร์ของคุณ
    ข้อความที่พิมพ์จะไม่ถูกส่งไปยัง AI API
  </p>
  <p id="aiStatus" class="status">
    ยังไม่ได้โหลดโมเดล AI
  </p>
  <label for="aiInput">รายละเอียดรายการค้า</label>
  <textarea id="aiInput"
    placeholder="เช่น ซื้ออุปกรณ์สำนักงาน 1,000 บาท จ่ายเงินสด"></textarea>
  <button id="aiStart" class="secondary">
    1. โหลด Small AI
  </button>
  <button id="aiAnalyze" class="primary" disabled
    style="margin-top:10px">
    2. วิเคราะห์ด้วย AI
  </button>
  <div id="aiResult" class="note"
    style="margin-top:16px;white-space:pre-wrap"></div>
`;

const main = document.querySelector("main");
const privacyCard = [...main.querySelectorAll(".card")]
  .find(el => el.textContent.includes("ความเป็นส่วนตัว"));

main.insertBefore(card, privacyCard || null);

const status = document.getElementById("aiStatus");
const startButton = document.getElementById("aiStart");
const analyzeButton = document.getElementById("aiAnalyze");
const input = document.getElementById("aiInput");
const output = document.getElementById("aiResult");

startButton.addEventListener("click", async () => {
  if (generator) return;

  startButton.disabled = true;
  status.textContent =
    "กำลังโหลดไลบรารีและโมเดล โปรดรอและอย่าปิดหน้านี้";

  try {
    loading ||= pipeline("text-generation", MODEL, {
      dtype: "q4"
    });

    generator = await loading;
    status.textContent =
      "โหลดโมเดลสำเร็จ ข้อความจะประมวลผลในเบราว์เซอร์";
    analyzeButton.disabled = false;
    startButton.textContent = "โหลดโมเดลแล้ว";
  } catch (error) {
    loading = null;
    status.textContent =
      "โหลดโมเดลไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตและลองใหม่";
    startButton.disabled = false;
    console.error(error);
  }
});

analyzeButton.addEventListener("click", async () => {
  const text = input.value.trim();

  if (!text) {
    output.textContent = "กรุณากรอกรายละเอียดรายการค้า";
    return;
  }

  analyzeButton.disabled = true;
  output.textContent = "AI กำลังวิเคราะห์...";

  try {
    const prompt = `
You are an accounting assistant.
Analyze this transaction: ${text}

Explain the likely transaction type and possible debit
and credit accounts. State assumptions and uncertainty.
Do not invent Thai tax rules. This is a preliminary
suggestion, not verified accounting or tax advice.

Answer:
`;

    const result = await generator(prompt, {
      max_new_tokens: 160,
      do_sample: false
    });

    output.textContent =
      result[0]?.generated_text || "ไม่พบผลลัพธ์";
  } catch (error) {
    output.textContent =
      "เกิดข้อผิดพลาดในการวิเคราะห์ กรุณาลองใหม่";
    console.error(error);
  } finally {
    analyzeButton.disabled = false;
  }
});
