const express = require("express");
const app = express();
const port = 3000;

// Define the redirect URL endpoint (e.g., http://localhost:3000/callback)
app.get("/callback", (req, res) => {
  // TikTok Shop will send the authorization code as a query parameter
  const authCode = req.query.code;
  const error = req.query.error;

  if (error) {
    // Handle errors if authorization fails
    console.log("Error during authorization:", error);
    res.send("Authorization failed. Check the console for details.");
    return;
  }

  if (authCode) {
    // Log the authorization code (you'll use this to get an access token)
    console.log("Authorization Code:", authCode);
    res.send("Authorization successful! Check the console for the code.");
    // Next step: Exchange this code for an access token using TikTok Shop's API
  } else {
    res.send("No authorization code received.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
