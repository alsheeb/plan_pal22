// ==============================
// CONFIGURE THESE VALUES
// ==============================
const EMAILJS_PUBLIC_KEY = "mtS1y1z7dnF5cczJc";       // e.g. "7axxxxxxxxxxxxx"
const EMAILJS_SERVICE_ID = "plant_pal";       // e.g. "service_abc123"
const EMAILJS_TEMPLATE_ID = "template_1aq0ywl";     // e.g. "template_xyz789"

// OTP settings
const OTP_LENGTH = 6;
const OTP_EXPIRATION_MINUTES = 5;

// Variables to store the current OTP and its expiration time in memory
let currentOTP = null;
let otpExpirationTime = null;

// Initialize EmailJS with your Public Key
// (emailjs object is loaded from the CDN in index.html)
emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Generate a numeric OTP with a specific length (e.g. 6 digits).
 */
function generateOTP(length) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10); // random digit 0-9
  }
  return otp;
}

/**
 * Send OTP to the email entered by the user using EmailJS.
 */
async function sendOTP() {
  const emailInput = document.getElementById("email-input");
  const messageEl = document.getElementById("message");
  const otpSection = document.getElementById("otp-section");
  const sendBtn = document.getElementById("send-otp-btn");

  const email = emailInput.value.trim();

  // Basic validation
  if (!email) {
    messageEl.textContent = "Please enter your email.";
    messageEl.style.color = "red";
    return;
  }

  // Optionally: very simple email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    messageEl.textContent = "Please enter a valid email address.";
    messageEl.style.color = "red";
    return;
  }

  // Generate a new OTP
  const otp = generateOTP(OTP_LENGTH);
  currentOTP = otp;
  otpExpirationTime = Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000;

  // Prepare template parameters for EmailJS
  // These must match the variable names in your EmailJS template
  const templateParams = {
    to_email: email, // this must match {{to_email}} in your template
    otp_code: otp    // this must match {{otp_code}} in your template
  };

  try {
    // Disable the button to prevent multiple clicks
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    // Send the email
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log("EmailJS response:", response);

    // Show success message and show OTP input section
    messageEl.textContent = "OTP sent to your email. Please check your inbox.";
    messageEl.style.color = "green";

    otpSection.style.display = "block";
  } catch (error) {
    console.error("EmailJS Error:", error);
    messageEl.textContent = "Failed to send OTP. Please try again.";
    messageEl.style.color = "red";
  } finally {
    // Re-enable the button
    sendBtn.disabled = false;
    sendBtn.textContent = "Send OTP";
  }
}

/**
 * Verify the OTP entered by the user.
 */
function verifyOTP() {
  const otpInput = document.getElementById("otp-input");
  const messageEl = document.getElementById("message");
  const enteredOTP = otpInput.value.trim();

  if (!enteredOTP) {
    messageEl.textContent = "Please enter the OTP.";
    messageEl.style.color = "red";
    return;
  }

  if (!currentOTP) {
    messageEl.textContent = "Please request a new OTP first.";
    messageEl.style.color = "red";
    return;
  }

  // Check expiration
  const now = Date.now();
  if (otpExpirationTime && now > otpExpirationTime) {
    messageEl.textContent = "OTP has expired. Please request a new one.";
    messageEl.style.color = "red";

    // Clear stored OTP
    currentOTP = null;
    otpExpirationTime = null;
    return;
  }

  // Compare entered OTP with generated one
  if (enteredOTP === currentOTP) {
    messageEl.textContent = "OTP verified successfully!";
    messageEl.style.color = "green";

    // Clear OTP after success
    currentOTP = null;
    otpExpirationTime = null;

    // TODO:
    // Here you can redirect the user or call your backend API.
    // Example:
    // window.location.href = "/dashboard.html";
  } else {
    messageEl.textContent = "Invalid OTP. Please try again.";
    messageEl.style.color = "red";
  }
}

/**
 * Attach event listeners after the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", function () {
  const sendBtn = document.getElementById("send-otp-btn");
  const verifyBtn = document.getElementById("verify-otp-btn");

  sendBtn.addEventListener("click", sendOTP);
  verifyBtn.addEventListener("click", verifyOTP);
});