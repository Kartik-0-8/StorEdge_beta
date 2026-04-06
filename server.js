const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for large batches
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get("/", (req, res) => {
  res.send("Backend is running ✅ - Batch processing enabled");
});

// Original single prediction (backward compatible)
app.get("/predict", (req, res) => {
  const { access, days, size } = req.query;

  if (!access || !days || !size) {
    return res.json({ error: "Missing parameters: access, days, size" });
  }

  exec(
    `python ../ml_model.py ${access} ${days} ${size}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error("Single predict error:", error, stderr);
        return res.json({ error: "ML error", prediction: "COLD" });
      }
      res.json({ prediction: stdout.trim() });
    }
  );
});

// NEW: Batch prediction for large datasets
app.post("/predict-batch", async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: "Invalid input: expected {rows: [{access, days, size}, ...]}" });
    }

    console.log(`Processing batch of ${rows.length} predictions...`);

    // Write batch data to temp file
    const tempFile = path.join(__dirname, "temp_batch.json");
    fs.writeFileSync(tempFile, JSON.stringify({ rows }));

    // Call python with --batch < temp_file
    return new Promise((resolve, reject) => {
      const pythonProcess = exec(`python ../ml_model.py --batch < ${tempFile}`, (error, stdout, stderr) => {
        // Clean up temp file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }

        if (error) {
          console.error("Batch predict error:", error, stderr);
          return reject(new Error("ML batch error"));
        }

        try {
          const predictions = JSON.parse(stdout.trim());
          res.json({ predictions, count: predictions.length });
        } catch (parseError) {
          console.error("JSON parse error:", parseError, stdout);
          res.status(500).json({ error: "Invalid ML response", predictions: ["COLD"] * rows.length });
        }
      });

      pythonProcess.on('error', (err) => {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        reject(err);
      });
    });
  } catch (error) {
    console.error("Batch endpoint error:", error);
    res.status(500).json({ error: "Server error", predictions: ["COLD"] * (req.body.rows?.length || 1) });
  }
});

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT} (Batch processing ready)`);
});
