const mongoose = require("mongoose");

exports.connectDB = async function () {
  const URI = process.env.MONDODB_URI;
  const connectionParams = {
    useUnifiedTopology: true,
  };

  mongoose.set("strictQuery", false);

  mongoose
    .connect(URI, connectionParams)
    .then(() => console.info("Connection established"))
    .catch((err) => console.error("Error" + err.message));
};
