const Plant = require("../models/Plant");

const searchPlant=async (req, res) => {
  const query = req.query.query || "";

  try {
    const plants = await Plant.find({
      name: { $regex: query, $options: "i" } // case-insensitive partial match
    }).limit(10);

    res.json(plants);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}