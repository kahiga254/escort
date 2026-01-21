package services

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

// MpesaService handles all MPESA API communications
type MpesaService struct {
	consumerKey    string
	consumerSecret string
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
		callbackURL:    os.Getenv("MPESA_CALLBACK_URL"),
		environment:    os.Getenv("MPESA_ENVIRONMENT"),
	}
}

// GetAccessToken obtains an OAuth token from MPESA
// This token is required for all API calls and expires after 1 hour
func (m *MpesaService) GetAccessToken() (string, error) {
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

// formatPhoneNumber converts Kenyan phone numbers to MPESA format
// Converts: 0712345678 → 254712345678
func formatPhoneNumber(phone string) string {
	// Remove any spaces or dashes
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "-", "")

	// If starts with 0, replace with 254
	if len(phone) == 10 && phone[0] == '0' {
		return "254" + phone[1:]
	}

	// If starts with +254, remove the +
	if len(phone) == 13 && phone[:4] == "+254" {
		return phone[1:]
	}

	// Return as-is (assuming already in 254 format)
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
		"BusinessShortCode": m.shortCode,             // Your business number
		"Password":          password,                // Generated password
		"Timestamp":         timestamp,               // Current timestamp
		"TransactionType":   "CustomerPayBillOnline", // Type of transaction
		"Amount":            amount,                  // Amount to pay
		"PartyA":            formattedPhone,          // Customer's phone
		"PartyB":            m.shortCode,             // Business number (receiver)
		"PhoneNumber":       formattedPhone,          // Customer's phone again
		"CallBackURL":       m.callbackURL,           // Where MPESA sends confirmation
		"AccountReference":  accountReference,        // Your reference (e.g., "SUB-abc123")
		"TransactionDesc":   transactionDesc,         // Description shown to customer
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

	// 11. Parse response
	var response map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	// 12. Check for errors
	if resp.StatusCode != 200 {
		errorDesc, _ := response["errorMessage"].(string)
		requestID, _ := response["requestId"].(string)
		return nil, fmt.Errorf("MPESA API error (Status %d): %s (RequestID: %s)",
			resp.StatusCode, errorDesc, requestID)
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
