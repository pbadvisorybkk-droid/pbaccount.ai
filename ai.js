
import { pipeline, env } from
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

env.allowLocalModels = false;

const MODEL = "onnx-community/SmolLM2-360M-ONNX";
let generator = null;
let loading = null;
let busy = false;

const card = document.createElement("section");
card.className = "card";
card.innerHTML = `
  <h2>PB_Account&amp;Tax — Small AI</h2>
  <p class="note">
    ทดลองประมวลผลบนอุปกรณ์ของคุณ
    ไม่ส่งรายละเอียดรายการค้าไปยัง AI API
  </p>
  <p id="aiStatus" class="status" role="status">
    พร้อมเริ่มต้น
  </p>
  <label for="aiInput">รายละเอียดรายการค้า</label>
  <textarea id="aiInput"
    placeholder="เช่น ซื้ออุปกรณ์สำนักงาน 1,000 บาท จ่ายเงินสด"></textarea>
  <button id="aiStart" class="secondary">
    โหลด Small AI
  </button>
  <button id="aiAnalyze" class="primary"
    disabled style="margin-top:10px">
    วิเคราะห์ด้วย AI
  </button>
  <pre id="aiResult" class="note"
    style="white-space:pre-wrap;overflow-wrap:anywhere"></pre>
`;

const main = document.querySelector("main");
if (!main) {
  document.body.appendChild(card);
} else {
  main.appendChild(card);
}

const status = document.getElementById("aiStatus");
const startButton = document.getElementById("aiStart");
const analyzeButton = document.getElementById("aiAnalyze");
const input = document.getElementById("aiInput");
const output = document.getElementById("aiResult");

startButton.addEventListener("click", async () => {
  if (generator || busy) return;

  busy = true;
  startButton.disabled = true;
  status.textContent = "กำลังโหลดโมเดล กรุณารอ...";
  output.textContent = "";

  try {
    loading ||= pipeline("text-generation", MODEL, {
      dtype: "q4"
    });

    generator = await loading;

    status.textContent =
      "โหลดโมเดลสำเร็จ พร้อมวิเคราะห์";
    analyzeButton.disabled = false;
    startButton.textContent = "โหลดโมเดลแล้ว";
  } catch (error) {
    loading = null;
    status.textContent =
      "โหลดไม่สำเร็จ: " + (error?.message || String(error));
    startButton.disabled = false;
  } finally {
    busy = false;
  }
});

analyzeButton.addEventListener("click", async () => {
  const text = input.value.trim();

  if (!text) {
    output.textContent = "กรุณากรอกรายละเอียดรายการค้า";
    return;
  }
  if (!generator || busy) {
    output.textContent = "กรุณาโหลดโมเดลให้สำเร็จก่อน";
    return;
  }

  busy = true;
  analyzeButton.disabled = true;
  output.textContent =
    "กำลังสร้างคำตอบ... โมเดลอาจใช้เวลาสักครู่";

  try {
    const prompt =
      "Transaction: " + text + "\n" +
      "Explain the transaction and suggest possible debit " +
      "and credit accounts. State assumptions. " +
      "If uncertain, say so. Do not claim tax compliance. " +
      "This is only a preliminary suggestion.\nAnswer:";

    const result = await generator(prompt, {
      max_new_tokens: 100,
      do_sample: false
    });

    const generated = result?.[0]?.generated_text;
    output.textContent =
      typeof generated === "string"
        ? generated.slice(prompt.length).trim() || generated
        : JSON.stringify(generated ?? result, null, 2);
  } catch (error) {
    output.textContent =
      "วิเคราะห์ไม่สำเร็จ: " +
      (error?.message || String(error));
  } finally {
    busy = false;
    analyzeButton.disabled = false;
  }
});
