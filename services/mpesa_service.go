package services

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// MpesaService handles all MPESA API communications
type MpesaService struct {
	consumerKey    string
	consumerSecret string
	storeNumber    string
	shortCode      string    // Business till number (174379 for sandbox)
	passKey        string    // Unique passkey from Safaricom
	callbackURL    string    // Where MPESA sends payment confirmation
	environment    string    // "sandbox" or "production"
	accessToken    string    // OAuth token for API calls
	tokenExpiry    time.Time // When token expires
}

// NewMpesaService creates a new MPESA service instance
func NewMpesaService() *MpesaService {
	// Read configuration from environment variables
	return &MpesaService{
		consumerKey:    os.Getenv("MPESA_CONSUMER_KEY"),
		consumerSecret: os.Getenv("MPESA_CONSUMER_SECRET"),
		shortCode:      os.Getenv("MPESA_SHORTCODE"),
		passKey:        os.Getenv("MPESA_PASSKEY"),
		storeNumber:    os.Getenv("MPESA_STORE_NUMBER"),
		callbackURL:    os.Getenv("MPESA_CALLBACK_URL"),
		environment:    os.Getenv("MPESA_ENVIRONMENT"),
	}
}

// GetAccessToken obtains an OAuth token from MPESA
// This token is required for all API calls and expires after 1 hour
func (m *MpesaService) GetAccessToken() (string, error) {

	callbackURL := os.Getenv("MPESA_CALLBACK_URL")
	fmt.Printf("🔧 DEBUG - Raw callback URL from env: '%s'\n", callbackURL)
	fmt.Printf("🔧 DEBUG - Callback URL length: %d\n", len(callbackURL))

	// Check if it contains the variable name
	if strings.Contains(callbackURL, "MPESA_CALLBACK_URL=") {
		fmt.Println("❌ ERROR: Callback URL contains variable name!")
		// Try to extract just the URL
		parts := strings.Split(callbackURL, "=")
		if len(parts) > 1 {
			callbackURL = parts[len(parts)-1]
			fmt.Printf("🔧 DEBUG - Extracted callback URL: '%s'\n", callbackURL)
		}
	}
	// Check if we have a valid cached token
	if time.Now().Before(m.tokenExpiry) && m.accessToken != "" {
		return m.accessToken, nil
	}

	// Determine URL based on environment (sandbox or production)
	url := "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
	if m.environment == "production" {
		url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
	}

	// Create HTTP request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	// MPESA uses Basic Authentication: base64(consumerKey:consumerSecret)
	credentials := m.consumerKey + ":" + m.consumerSecret
	authHeader := base64.StdEncoding.EncodeToString([]byte(credentials))
	req.Header.Set("Authorization", "Basic "+authHeader)

	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to get access token: %v", err)
	}
	defer resp.Body.Close()

	// Parse response
	var result struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   string `json:"expires_in"` // Usually "3599" seconds
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %v", err)
	}

	if result.AccessToken == "" {
		return "", fmt.Errorf("MPESA returned empty access token")
	}

	// Cache the token
	m.accessToken = result.AccessToken
	m.tokenExpiry = time.Now().Add(3500 * time.Second) // 58 minutes (safe margin)

	fmt.Println("✅ MPESA Access Token obtained successfully")
	return m.accessToken, nil
}

func formatPhoneNumber(phone string) string {
	phone = strings.ReplaceAll(phone, "+", "")
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")

	// Convert 07xx or 01xx to 2547xx or 2541xx
	if strings.HasPrefix(phone, "0") {
		phone = "254" + phone[1:]
	}

	// If already 254xxx, leave as is
	return phone
}

// InitiateSTKPush sends an STK Push request to customer's phone
// The customer receives a prompt to enter MPESA PIN
func (m *MpesaService) InitiateSTKPush(
	phoneNumber string,
	amount int,
	accountReference,
	transactionDesc string,
) (map[string]interface{}, error) {

	fmt.Println("=== MPESA CONFIGURATION DEBUG ===")
	fmt.Printf("Consumer Key exists: %v\n", m.consumerKey != "")
	fmt.Printf("Consumer Secret exists: %v\n", m.consumerSecret != "")
	fmt.Printf("ShortCode: %s\n", m.shortCode)
	fmt.Printf("PassKey exists: %v\n", m.passKey != "")
	fmt.Printf("Callback URL: %s\n", m.callbackURL)
	fmt.Printf("Environment: %s\n", m.environment)
	fmt.Printf("Amount being sent: %d\n", amount)
	fmt.Println("================================")

	fmt.Printf("🚀 Initiating MPESA Payment:\n")
	fmt.Printf("   📱 Phone: %s\n", phoneNumber)
	fmt.Printf("   💰 Amount: %d\n", amount)
	fmt.Printf("   📝 Reference: %s\n", accountReference)
	fmt.Printf("   📄 Description: %s\n", transactionDesc)

	// 1. Get access token
	accessToken, err := m.GetAccessToken()
	if err != nil {
		return nil, fmt.Errorf("failed to get access token: %v", err)
	}

	// 2. Format phone number for MPESA
	formattedPhone := formatPhoneNumber(phoneNumber)
	fmt.Printf("   📞 Formatted Phone: %s\n", formattedPhone)

	// 3. Generate timestamp (format: YYYYMMDDHHMMSS)
	timestamp := time.Now().Format("20060102150405")

	// 4. Generate password: base64(Shortcode + Passkey + Timestamp)
	passwordString := m.shortCode + m.passKey + timestamp
	password := base64.StdEncoding.EncodeToString([]byte(passwordString))

	// 5. Create STK Push request body
	requestBody := map[string]interface{}{
		"BusinessShortCode": m.shortCode,              // Your business number
		"Password":          password,                 // Generated password
		"Timestamp":         timestamp,                // Current timestamp
		"TransactionType":   "CustomerBuyGoodsOnline", // Type of transaction
		"Amount":            amount,                   // Amount to pay
		"PartyA":            formattedPhone,           // Customer's phone
		"PartyB":            m.storeNumber,            // Business number (receiver)
		"PhoneNumber":       formattedPhone,           // Customer's phone again
		"CallBackURL":       m.callbackURL,            // Where MPESA sends confirmation
		"AccountReference":  accountReference,         // Your reference (e.g., "SUB-abc123")
		"TransactionDesc":   transactionDesc,          // Description shown to customer
	}

	// 6. Convert to JSON
	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	// 7. Determine API endpoint
	url := "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
	if m.environment == "production" {
		url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
	}

	// 8. Create HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// 9. Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)

	// 10. Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// ⭐⭐ FIXED SECTION - ADD DEBUG LOGGING ⭐⭐
	fmt.Printf("📡 MPESA Response Status Code: %d\n", resp.StatusCode)

	// Read the response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}
	bodyString := string(bodyBytes)
	fmt.Printf("📡 MPESA Response Body: %s\n", bodyString)

	// Parse response from the bytes we just read
	var response map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &response); err != nil {
		fmt.Printf("❌ Failed to parse JSON: %v\n", err)
		return nil, fmt.Errorf("invalid JSON response from MPESA: %v", err)
	}

	// 12. Check for errors
	if resp.StatusCode != 200 {
		errorDesc, _ := response["errorMessage"].(string)
		errorCode, _ := response["errorCode"].(string)
		requestID, _ := response["requestId"].(string)

		fmt.Printf("❌ MPESA API Error Details:\n")
		fmt.Printf("   Error Code: %s\n", errorCode)
		fmt.Printf("   Error Message: %s\n", errorDesc)
		fmt.Printf("   Request ID: %s\n", requestID)

		return nil, fmt.Errorf("MPESA API error %s (Status %d): %s",
			errorCode, resp.StatusCode, errorDesc)
	}

	// 13. Check response code
	responseCode, ok := response["ResponseCode"].(string)
	if !ok || responseCode != "0" {
		errorDesc, _ := response["ResponseDescription"].(string)
		return nil, fmt.Errorf("MPESA rejected request: %s", errorDesc)
	}

	// 14. Log success
	fmt.Println("✅ MPESA STK Push initiated successfully!")
	fmt.Printf("   📋 Checkout ID: %v\n", response["CheckoutRequestID"])
	fmt.Printf("   📋 Merchant ID: %v\n", response["MerchantRequestID"])
	fmt.Printf("   💬 Message: %v\n", response["CustomerMessage"])

	return response, nil
}
